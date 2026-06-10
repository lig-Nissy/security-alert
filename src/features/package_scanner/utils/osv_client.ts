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

function parseCvssBase(score: string): number | null {
    const match = score.match(/CVSS:[\d.]+\/([A-Z0-9:/.-]+)/);
    if (!match) return null;
    const parts = match[1].split("/");
    for (const part of parts) {
        if (part.startsWith("S:")) continue;
    }
    const baseMatch = score.match(/\bbase[Ss]core[:=]([\d.]+)\b/);
    if (baseMatch) return Number.parseFloat(baseMatch[1]);
    return null;
}

function severityFromCvss(score: string): Severity {
    const v = parseCvssBase(score);
    if (v === null) return "unknown";
    if (v >= 9) return "critical";
    if (v >= 7) return "high";
    if (v >= 4) return "medium";
    if (v > 0) return "low";
    return "unknown";
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
