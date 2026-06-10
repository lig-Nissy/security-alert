import type { PackageRef } from "@/features/package_scanner/types/package";
import type { Severity, Vulnerability } from "@/features/package_scanner/types/vulnerability";

const OSV_BATCH_URL = "https://api.osv.dev/v1/querybatch";
const OSV_VULN_URL = "https://api.osv.dev/v1/vulns";
const OSV_ECOSYSTEM: Record<PackageRef["ecosystem"], string> = { npm: "npm" };

type OsvBatchResponse = {
    results: { vulns?: { id: string; modified?: string }[] }[];
};

type OsvSeverity = { type: string; score: string };

type OsvVulnDetail = {
    id: string;
    aliases?: string[];
    summary?: string;
    details?: string;
    severity?: OsvSeverity[];
    affected?: {
        package?: { name?: string; ecosystem?: string };
        ranges?: { type: string; events: { introduced?: string; fixed?: string }[] }[];
        versions?: string[];
    }[];
    references?: { type: string; url: string }[];
    database_specific?: { severity?: string };
};

const CVSS3_AV: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const CVSS3_AC: Record<string, number> = { L: 0.77, H: 0.44 };
const CVSS3_UI: Record<string, number> = { N: 0.85, R: 0.62 };
const CVSS3_CIA: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };
// PR depends on Scope (Unchanged/Changed). Index by scope first, then PR.
const CVSS3_PR: Record<string, Record<string, number>> = {
    U: { N: 0.85, L: 0.62, H: 0.27 },
    C: { N: 0.85, L: 0.68, H: 0.5 },
};

function roundUp1(value: number): number {
    // CVSS v3.x "roundUp1": round up to 1 decimal place. Uses integer math to avoid FP drift.
    const scaled = Math.round(value * 100000);
    if (scaled % 10000 === 0) return scaled / 100000;
    return (Math.floor(scaled / 10000) + 1) / 10;
}

function parseVectorMetrics(vector: string): Record<string, string> | null {
    const trimmed = vector.trim();
    const slash = trimmed.indexOf("/");
    if (slash < 0) return null;
    const head = trimmed.slice(0, slash);
    if (!/^CVSS:\d+(?:\.\d+)?$/.test(head)) return null;
    const out: Record<string, string> = { __version: head.slice("CVSS:".length) };
    for (const segment of trimmed.slice(slash + 1).split("/")) {
        const colon = segment.indexOf(":");
        if (colon <= 0) continue;
        const key = segment.slice(0, colon);
        const value = segment.slice(colon + 1);
        if (key && value) out[key] = value;
    }
    return out;
}

function computeCvss3Base(vector: string): number | null {
    const metrics = parseVectorMetrics(vector);
    if (!metrics) return null;
    if (!metrics.__version.startsWith("3")) return null;

    const av = CVSS3_AV[metrics.AV];
    const ac = CVSS3_AC[metrics.AC];
    const ui = CVSS3_UI[metrics.UI];
    const scope = metrics.S;
    const prTable = CVSS3_PR[scope];
    const pr = prTable ? prTable[metrics.PR] : undefined;
    const c = CVSS3_CIA[metrics.C];
    const i = CVSS3_CIA[metrics.I];
    const a = CVSS3_CIA[metrics.A];
    if (
        av === undefined ||
        ac === undefined ||
        ui === undefined ||
        pr === undefined ||
        c === undefined ||
        i === undefined ||
        a === undefined
    ) {
        return null;
    }

    const iss = 1 - (1 - c) * (1 - i) * (1 - a);
    const impact = scope === "U" ? 6.42 * iss : 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15;
    const exploitability = 8.22 * av * ac * pr * ui;
    if (impact <= 0) return 0;
    const raw = scope === "U" ? impact + exploitability : 1.08 * (impact + exploitability);
    return roundUp1(Math.min(raw, 10));
}

function computeCvss4Base(vector: string): number | null {
    // Full CVSS v4 base score requires lookup tables. Fall back to a coarse
    // mapping using the four severity macro-vectors when available.
    const metrics = parseVectorMetrics(vector);
    if (!metrics) return null;
    if (!metrics.__version.startsWith("4")) return null;
    // Conservative: rely on the explicit AT/AC/UI/VC/VI/VA fields. If any required
    // base metric is missing, give up rather than guess.
    const required = ["AV", "AC", "AT", "PR", "UI", "VC", "VI", "VA", "SC", "SI", "SA"];
    if (required.some((k) => !metrics[k])) return null;
    // Highest impact present (Vulnerable + Subsequent) is a reasonable upper bound
    // for severity bucketing when we can't do the full computation.
    const impactWeights: Record<string, number> = { H: 3, L: 2, N: 0 };
    const impacts = ["VC", "VI", "VA", "SC", "SI", "SA"].map((k) => impactWeights[metrics[k]] ?? 0);
    const maxImpact = Math.max(...impacts);
    if (maxImpact === 0) return 0;
    const avWeight: Record<string, number> = { N: 3, A: 2, L: 1, P: 0 };
    const exploit = (avWeight[metrics.AV] ?? 0) + (metrics.UI === "N" ? 1 : 0);
    // Map to a 0-10 bucket. This is intentionally coarse and used only as a fallback.
    const approx = maxImpact * 2 + exploit;
    return Math.min(approx, 10);
}

function computeCvssBaseScore(vector: string): number | null {
    if (vector.startsWith("CVSS:3")) return computeCvss3Base(vector);
    if (vector.startsWith("CVSS:4")) return computeCvss4Base(vector);
    return null;
}

function severityFromBaseScore(score: number): Severity {
    if (score >= 9) return "critical";
    if (score >= 7) return "high";
    if (score >= 4) return "medium";
    if (score > 0) return "low";
    return "unknown";
}

function severityFromCvss(vector: string): Severity {
    const score = computeCvssBaseScore(vector);
    if (score === null) return "unknown";
    return severityFromBaseScore(score);
}

function severityFromLabel(label: string): Severity {
    const lower = label.toLowerCase();
    if (lower.includes("critical")) return "critical";
    if (lower.includes("high")) return "high";
    if (lower.includes("moderate") || lower.includes("medium")) return "medium";
    if (lower.includes("low")) return "low";
    return "unknown";
}

function deriveSeverity(detail: OsvVulnDetail): Severity {
    if (detail.database_specific?.severity) {
        const fromLabel = severityFromLabel(detail.database_specific.severity);
        if (fromLabel !== "unknown") return fromLabel;
    }
    if (detail.severity && detail.severity.length > 0) {
        for (const s of detail.severity) {
            if (s.type === "CVSS_V3" || s.type === "CVSS_V4") {
                const guess = severityFromCvss(s.score);
                if (guess !== "unknown") return guess;
            }
        }
        for (const s of detail.severity) {
            const guess = severityFromCvss(s.score);
            if (guess !== "unknown") return guess;
        }
    }
    return "unknown";
}

function deriveFixedVersion(detail: OsvVulnDetail, pkgName: string): string | undefined {
    for (const aff of detail.affected ?? []) {
        if (aff.package?.name?.toLowerCase() !== pkgName.toLowerCase()) continue;
        for (const range of aff.ranges ?? []) {
            for (const event of range.events) {
                if (event.fixed) return event.fixed;
            }
        }
    }
    return undefined;
}

function deriveAffectedRange(detail: OsvVulnDetail, pkgName: string): string | undefined {
    const segments: string[] = [];
    for (const aff of detail.affected ?? []) {
        if (aff.package?.name?.toLowerCase() !== pkgName.toLowerCase()) continue;
        for (const range of aff.ranges ?? []) {
            const introduced = range.events.find((e) => e.introduced)?.introduced;
            const fixed = range.events.find((e) => e.fixed)?.fixed;
            if (introduced && fixed) segments.push(`>= ${introduced}, < ${fixed}`);
            else if (introduced) segments.push(`>= ${introduced}`);
            else if (fixed) segments.push(`< ${fixed}`);
        }
    }
    return segments.length > 0 ? segments.join("; ") : undefined;
}

export async function queryOsvBatch(refs: PackageRef[]): Promise<OsvBatchResponse> {
    const body = {
        queries: refs.map((r) => ({
            package: { name: r.name, ecosystem: OSV_ECOSYSTEM[r.ecosystem] },
            version: r.version,
        })),
    };
    const res = await fetch(OSV_BATCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OSV batch ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as OsvBatchResponse;
}

export async function fetchOsvVuln(id: string): Promise<OsvVulnDetail> {
    const res = await fetch(`${OSV_VULN_URL}/${encodeURIComponent(id)}`);
    if (!res.ok) {
        throw new Error(`OSV vuln request failed: ${res.status}`);
    }
    return (await res.json()) as OsvVulnDetail;
}

export function toVulnerability(detail: OsvVulnDetail, pkgName: string): Vulnerability {
    return {
        id: detail.id,
        summary: detail.summary ?? detail.id,
        details: detail.details,
        severity: deriveSeverity(detail),
        aliases: detail.aliases ?? [],
        references: detail.references ?? [],
        affectedRanges: deriveAffectedRange(detail, pkgName),
        fixedVersion: deriveFixedVersion(detail, pkgName),
    };
}
