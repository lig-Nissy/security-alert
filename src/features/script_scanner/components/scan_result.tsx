import { FindingCard } from "@/features/script_scanner/components/finding_card";
import type {
    ScanResult as ScanResultType,
    Severity,
} from "@/features/script_scanner/types/finding";

const ORDER: readonly Severity[] = ["critical", "high", "medium", "low", "info"] as const;

const BADGE_STYLE: Record<Severity, string> = {
    critical:
        "bg-red-100 text-red-900 border-red-400 dark:bg-red-950 dark:text-red-100 dark:border-red-700",
    high: "bg-orange-100 text-orange-900 border-orange-400 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-700",
    medium: "bg-yellow-100 text-yellow-900 border-yellow-400 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-700",
    low: "bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-700",
    info: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700",
};

const ZERO_BADGE_STYLE =
    "bg-transparent text-zinc-500 border-zinc-200 dark:text-zinc-500 dark:border-zinc-800";

export function ScanResult({ result }: { result: ScanResultType }) {
    const counts = ORDER.map((sev) => ({
        sev,
        count: result.findings.filter((f) => f.severity === sev).length,
    }));
    const sortedFindings = [...result.findings].sort(
        (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity),
    );

    return (
        <section className="space-y-4">
            <header className="space-y-2">
                <h2 className="text-xl font-semibold">スキャン結果</h2>
                <p className="text-sm opacity-80">
                    {result.scriptsFound} 個の外部スクリプトを検出 ／ {result.findings.length}{" "}
                    件の指摘
                </p>
                <ul className="flex flex-wrap gap-2 text-xs">
                    {counts.map(({ sev, count }) => (
                        <li
                            key={sev}
                            className={`px-2 py-1 rounded border font-medium ${
                                count > 0 ? BADGE_STYLE[sev] : ZERO_BADGE_STYLE
                            }`}
                        >
                            <span className="uppercase tracking-wider">{sev}</span>: {count}
                        </li>
                    ))}
                </ul>
            </header>
            {sortedFindings.length === 0 ? (
                <p className="text-sm">指摘事項は見つかりませんでした。</p>
            ) : (
                <ul className="space-y-3">
                    {sortedFindings.map((finding) => (
                        <li
                            key={`${finding.category}-${finding.source.url}-${finding.source.lineNumber}`}
                        >
                            <FindingCard finding={finding} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
