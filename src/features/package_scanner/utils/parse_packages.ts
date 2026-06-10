import type { PackageRef } from "@/features/package_scanner/types/package";
import { detectInputType } from "@/features/package_scanner/utils/detect_input_type";

const SEMVER_EXACT = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of items) {
        const k = key(item);
        if (!seen.has(k)) {
            seen.add(k);
            out.push(item);
        }
    }
    return out;
}

function parsePackageJson(raw: string): PackageRef[] {
    const refs: PackageRef[] = [];
    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        return refs;
    }
    if (!json || typeof json !== "object") return refs;
    const obj = json as Record<string, unknown>;
    const sections: PackageRef["location"][] = [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
    ];
    for (const section of sections) {
        const deps = obj[section];
        if (!deps || typeof deps !== "object") continue;
        for (const [name, spec] of Object.entries(deps as Record<string, unknown>)) {
            if (typeof spec !== "string") continue;
            const version = normalizeVersionSpec(spec);
            if (!version) continue;
            refs.push({
                name,
                version,
                ecosystem: "npm",
                source: "package.json",
                location: section,
            });
        }
    }
    return refs;
}

function normalizeVersionSpec(spec: string): string | null {
    const cleaned = spec
        .trim()
        .replace(/^[\^~>=<]+/, "")
        .split(" ")[0];
    if (SEMVER_EXACT.test(cleaned)) return cleaned;
    if (/^\d+\.\d+(?:\.\d+)?$/.test(cleaned)) return cleaned;
    return null;
}

function parsePackageLock(raw: string): PackageRef[] {
    const refs: PackageRef[] = [];
    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        return refs;
    }
    if (!json || typeof json !== "object") return refs;
    const obj = json as Record<string, unknown>;
    const packages = obj.packages;
    if (packages && typeof packages === "object") {
        for (const [path, value] of Object.entries(packages as Record<string, unknown>)) {
            if (!path || !value || typeof value !== "object") continue;
            if (path === "") continue;
            const match = path.match(/node_modules\/((?:@[^/]+\/)?[^/]+)$/);
            if (!match) continue;
            const name = match[1];
            const version = (value as { version?: unknown }).version;
            if (typeof version !== "string" || !SEMVER_EXACT.test(version)) continue;
            refs.push({
                name,
                version,
                ecosystem: "npm",
                source: "package-lock.json",
                location: "resolved",
            });
        }
    }
    return refs;
}

function parseYarnLock(raw: string): PackageRef[] {
    const refs: PackageRef[] = [];
    const blocks = raw.split(/\n\n+/);
    for (const block of blocks) {
        const headerLine = block.split("\n")[0];
        if (!headerLine || headerLine.startsWith("#")) continue;
        const versionMatch = block.match(/^\s+version\s+"?([^"\s]+)"?/m);
        if (!versionMatch) continue;
        const version = versionMatch[1];
        if (!SEMVER_EXACT.test(version)) continue;
        const header = headerLine.replace(/:$/, "").replace(/"/g, "");
        const firstSpec = header.split(",")[0].trim();
        const atIdx = firstSpec.lastIndexOf("@");
        if (atIdx <= 0) continue;
        const name = firstSpec.slice(0, atIdx);
        refs.push({
            name,
            version,
            ecosystem: "npm",
            source: "yarn.lock",
            location: "resolved",
        });
    }
    return refs;
}

function parsePnpmLock(raw: string): PackageRef[] {
    const refs: PackageRef[] = [];
    const PACKAGE_KEY = /^ {2}(?:\/(?:@[^/]+\/)?[^/:]+(?:@|\/)[^\s:]+):$/gm;
    let match: RegExpExecArray | null = PACKAGE_KEY.exec(raw);
    while (match !== null) {
        const key = match[0].trim().replace(/:$/, "").replace(/^\//, "");
        const sepIdx = key.lastIndexOf("@");
        if (sepIdx > 0) {
            const name = key.slice(0, sepIdx);
            const version = key.slice(sepIdx + 1).split("(")[0];
            if (SEMVER_EXACT.test(version)) {
                refs.push({
                    name,
                    version,
                    ecosystem: "npm",
                    source: "pnpm-lock.yaml",
                    location: "resolved",
                });
            }
        }
        match = PACKAGE_KEY.exec(raw);
    }
    return refs;
}

export function parsePackages(raw: string): {
    refs: PackageRef[];
    inputType: ReturnType<typeof detectInputType>;
} {
    const inputType = detectInputType(raw);
    let refs: PackageRef[] = [];
    switch (inputType) {
        case "package.json":
            refs = parsePackageJson(raw);
            break;
        case "package-lock.json":
            refs = parsePackageLock(raw);
            break;
        case "yarn.lock":
            refs = parseYarnLock(raw);
            break;
        case "pnpm-lock.yaml":
            refs = parsePnpmLock(raw);
            break;
        default:
            refs = [];
    }
    refs = dedupeBy(refs, (r) => `${r.name}@${r.version}`);
    return { refs, inputType };
}
