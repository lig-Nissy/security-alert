"use client";

import { useState } from "react";
import { BackLink } from "@/components/back_link";
import { InputForm } from "@/features/script_scanner/components/input_form";
import { ScanResult } from "@/features/script_scanner/components/scan_result";
import type { ScanResult as ScanResultType } from "@/features/script_scanner/types/finding";
import { scanScripts } from "@/features/script_scanner/utils/scan_scripts";

export function ScannerPage() {
    const [result, setResult] = useState<ScanResultType | null>(null);

    const handleScan = (input: string) => {
        setResult(scanScripts(input));
    };

    return (
        <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
            <BackLink />

            <header className="space-y-2">
                <h1 className="text-2xl font-bold">外部スクリプト サプライチェーン スキャナ</h1>
                <p className="text-sm opacity-80 leading-relaxed">
                    polyfill.io 型のサプライチェーン攻撃を防ぐため、貼り付けたHTML/JSに含まれる
                    <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                        {"<script src>"}
                    </code>
                    と動的 import
                    を解析し、侵害済みドメイン参照、SRI欠落、バージョン非固定、未審査CDNを検出します。
                </p>
            </header>

            <InputForm onScan={handleScan} />

            {result && <ScanResult result={result} />}
        </main>
    );
}
