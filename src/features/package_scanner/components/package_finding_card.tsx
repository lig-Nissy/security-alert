import type { PackageFinding, Severity } from "@/features/package_scanner/types/vulnerability";

const CARD_STYLE: Record<Severity, string> = {
    critical:
        "bg-red-50 text-red-950 border-red-500 dark:bg-red-950 dark:text-red-50 dark:border-red-500",
    high: "bg-orange-50 text-orange-950 border-orange-500 dark:bg-orange-950 dark:text-orange-50 dark:border-orange-500",
    medium: "bg-yellow-50 text-yellow-950 border-yellow-500 dark:bg-yellow-950 dark:text-yellow-50 dark:border-yellow-500",
    low: "bg-blue-50 text-blue-950 border-blue-500 dark:bg-blue-950 dark:text-blue-50 dark:border-blue-500",
    unknown:
        "bg-zinc-50 text-zinc-900 border-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-600",
};

const BADGE_STYLE: Record<Severity, string> = {
    critical: "bg-red-600 text-white border-red-700",
    high: "bg-orange-500 text-white border-orange-600",
    medium: "bg-yellow-400 text-yellow-950 border-yellow-500",
    low: "bg-blue-500 text-white border-blue-600",
    unknown: "bg-zinc-400 text-zinc-950 border-zinc-500",
};

const SEVERITY_LABEL: Record<Severity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    unknown: "Unknown",
};

const SEVERITY_RANK: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    unknown: 4,
};

function severityBadge(sev: Severity) {
    return (
        <span
            className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider border rounded ${BADGE_STYLE[sev]}`}
        >
            {SEVERITY_LABEL[sev]}
        </span>
    );
}

export function PackageFindingCard({ finding }: { finding: PackageFinding }) {
    const topSeverity: Severity =
        finding.vulnerabilities.length > 0
            ? finding.vulnerabilities.reduce<Severity>(
                  (acc, v) => (SEVERITY_RANK[v.severity] < SEVERITY_RANK[acc] ? v.severity : acc),
                  finding.vulnerabilities[0].severity,
              )
            : "unknown";

    const sortedVulns = [...finding.vulnerabilities].sort(
        (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );

    return (
        <article className={`border-l-4 rounded-md p-4 space-y-3 ${CARD_STYLE[topSeverity]}`}>
            <header className="flex items-center gap-2 flex-wrap">
                {severityBadge(topSeverity)}
                <h3 className="font-semibold text-base">
                    {finding.package.name}
                    <span className="opacity-70"> @ {finding.package.version}</span>
                </h3>
                <span className="text-xs opacity-70">({finding.package.location})</span>
            </header>

            {finding.compromisedNotice && (
                <div className="text-sm border border-red-500 bg-red-100/70 dark:bg-red-950/60 dark:border-red-400 rounded p-2 text-red-950 dark:text-red-50">
                    <strong>侵害履歴: </strong>
                    {finding.compromisedNotice.description}{" "}
                    <a
                        href={finding.compromisedNotice.reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        {finding.compromisedNotice.reference.label}
                    </a>
                </div>
            )}

            {sortedVulns.length > 0 && (
                <ul className="space-y-2">
                    {sortedVulns.map((vuln) => (
                        <li
                            key={vuln.id}
                            className="text-sm border border-current/20 rounded p-2 space-y-1 bg-white/60 dark:bg-black/30"
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                {severityBadge(vuln.severity)}
                                <span className="font-mono text-xs">{vuln.id}</span>
                                {vuln.aliases.slice(0, 3).map((alias) => (
                                    <span key={alias} className="font-mono text-xs opacity-70">
                                        {alias}
                                    </span>
                                ))}
                            </div>
                            <p>{vuln.summary}</p>
                            {vuln.affectedRanges && (
                                <p className="text-xs opacity-80">
                                    <strong>影響範囲: </strong>
                                    {vuln.affectedRanges}
                                </p>
                            )}
                            {vuln.fixedVersion && (
                                <p className="text-xs">
                                    <strong>修正版: </strong>
                                    {vuln.fixedVersion}
                                </p>
                            )}
                            {vuln.references && vuln.references.length > 0 && (
                                <p className="text-xs">
                                    <a
                                        href={
                                            vuln.references.find((r) => r.type === "ADVISORY")
                                                ?.url ?? vuln.references[0].url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline"
                                    >
                                        詳細を見る
                                    </a>
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
