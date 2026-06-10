"use client";

import { useState } from "react";
import { InputForm } from "@/features/package_scanner/components/input_form";
import { ScanReport } from "@/features/package_scanner/components/scan_report";
import type { ScanReport as ScanReportType } from "@/features/package_scanner/types/vulnerability";
import { parsePackages } from "@/features/package_scanner/utils/parse_packages";

export function ScannerPage() {
    const [report, setReport] = useState<ScanReportType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputType, setInputType] = useState<string | null>(null);

    const handleScan = async (input: string) => {
        setError(null);
        setReport(null);
        const { refs, inputType: detected } = parsePackages(input);
        setInputType(detected);
        if (detected === "unknown") {
            setError(
                "入力形式を判別できませんでした。package.json / package-lock.json / yarn.lock / pnpm-lock.yaml を貼り付けてください。",
            );
            return;
        }
        if (refs.length === 0) {
            setError(
                "対象パッケージを抽出できませんでした。バージョンが完全指定 (例: 1.2.3) のものだけが照会対象になります。",
            );
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/osv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refs }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? `スキャンに失敗しました: ${res.status}`);
            }
            const data = (await res.json()) as ScanReportType;
            setReport(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
            <header className="space-y-2">
                <h1 className="text-2xl font-bold">パッケージ脆弱性スキャナ</h1>
                <p className="text-sm opacity-80 leading-relaxed">
                    npm パッケージのバージョン情報を OSV.dev (Google) に照会し、既知の CVE
                    と過去にサプライチェーン攻撃が確認されたパッケージを検出します。
                    入力は当サーバを経由しますが永続化されません。
                </p>
            </header>

            <InputForm onScan={handleScan} loading={loading} error={error} />

            {inputType && inputType !== "unknown" && (
                <p className="text-xs opacity-70">検出形式: {inputType}</p>
            )}

            {report && <ScanReport report={report} />}
        </main>
    );
}
