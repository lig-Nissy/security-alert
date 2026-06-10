import type { Finding, Severity } from "@/features/script_scanner/types/finding";

const CARD_STYLE: Record<Severity, string> = {
    critical:
        "bg-red-50 text-red-950 border-red-500 dark:bg-red-950 dark:text-red-50 dark:border-red-500",
    high: "bg-orange-50 text-orange-950 border-orange-500 dark:bg-orange-950 dark:text-orange-50 dark:border-orange-500",
    medium: "bg-yellow-50 text-yellow-950 border-yellow-500 dark:bg-yellow-950 dark:text-yellow-50 dark:border-yellow-500",
    low: "bg-blue-50 text-blue-950 border-blue-500 dark:bg-blue-950 dark:text-blue-50 dark:border-blue-500",
    info: "bg-zinc-50 text-zinc-900 border-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-600",
};

const BADGE_STYLE: Record<Severity, string> = {
    critical: "bg-red-600 text-white border-red-700",
    high: "bg-orange-500 text-white border-orange-600",
    medium: "bg-yellow-400 text-yellow-950 border-yellow-500",
    low: "bg-blue-500 text-white border-blue-600",
    info: "bg-zinc-400 text-zinc-950 border-zinc-500",
};

const SEVERITY_LABEL: Record<Severity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Info",
};

export function FindingCard({ finding }: { finding: Finding }) {
    return (
        <article className={`border-l-4 rounded-md p-4 space-y-2 ${CARD_STYLE[finding.severity]}`}>
            <header className="flex items-center gap-2 flex-wrap">
                <span
                    className={`inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider border rounded ${BADGE_STYLE[finding.severity]}`}
                >
                    {SEVERITY_LABEL[finding.severity]}
                </span>
                <h3 className="font-semibold text-base">{finding.title}</h3>
            </header>
            <p className="text-sm leading-relaxed">{finding.description}</p>
            <div className="text-sm">
                <strong>推奨対応: </strong>
                {finding.recommendation}
            </div>
            <dl className="text-xs space-y-1 opacity-80">
                <div>
                    <dt className="inline font-semibold">対象URL: </dt>
                    <dd className="inline break-all">{finding.source.url}</dd>
                </div>
                <div>
                    <dt className="inline font-semibold">行番号: </dt>
                    <dd className="inline">{finding.source.lineNumber}</dd>
                </div>
                {finding.reference && (
                    <div>
                        <dt className="inline font-semibold">参考: </dt>
                        <dd className="inline">
                            <a
                                href={finding.reference.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                {finding.reference.label}
                            </a>
                        </dd>
                    </div>
                )}
            </dl>
        </article>
    );
}
