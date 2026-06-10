"use client";

import { useState } from "react";

const SAMPLE_HTML = `<!doctype html>
<html>
  <head>
    <script src="https://polyfill.io/v3/polyfill.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  </head>
  <body></body>
</html>`;

type Props = {
    onScan: (input: string) => void;
    loading?: boolean;
};

export function InputForm({ onScan, loading }: Props) {
    const [value, setValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onScan(value);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="scan-input" className="block text-sm font-medium">
                HTML / JavaScript コードを貼り付けてください
            </label>
            <textarea
                id="scan-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={12}
                placeholder="<script src=&quot;https://...&quot;></script>"
                className="w-full font-mono text-sm border border-zinc-300 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-900"
            />
            <div className="flex gap-2 flex-wrap">
                <button
                    type="submit"
                    disabled={loading || value.trim().length === 0}
                    className="px-4 py-2 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    {loading ? "スキャン中..." : "スキャン実行"}
                </button>
                <button
                    type="button"
                    onClick={() => setValue(SAMPLE_HTML)}
                    className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    サンプルを挿入
                </button>
                <button
                    type="button"
                    onClick={() => setValue("")}
                    className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    クリア
                </button>
            </div>
        </form>
    );
}
