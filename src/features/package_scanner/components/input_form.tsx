"use client";

import { useState } from "react";

const SAMPLE_PACKAGE_JSON = `{
  "name": "demo",
  "dependencies": {
    "lodash": "4.17.20",
    "minimist": "1.2.5",
    "ua-parser-js": "0.7.29",
    "event-stream": "3.3.6"
  }
}`;

type Props = {
    onScan: (input: string) => void;
    loading?: boolean;
    error?: string | null;
};

export function InputForm({ onScan, loading, error }: Props) {
    const [value, setValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onScan(value);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="pkg-scan-input" className="block text-sm font-medium">
                package.json / package-lock.json / yarn.lock / pnpm-lock.yaml
                の中身を貼り付けてください
            </label>
            <textarea
                id="pkg-scan-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={14}
                placeholder='{ "dependencies": { "lodash": "4.17.20" } }'
                className="w-full font-mono text-sm border border-zinc-300 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-900"
            />
            {error && (
                <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {error}
                </p>
            )}
            <div className="flex gap-2 flex-wrap">
                <button
                    type="submit"
                    disabled={loading || value.trim().length === 0}
                    className="px-4 py-2 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    {loading ? "OSV.dev に照会中..." : "脆弱性スキャン"}
                </button>
                <button
                    type="button"
                    onClick={() => setValue(SAMPLE_PACKAGE_JSON)}
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
