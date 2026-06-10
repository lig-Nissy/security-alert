import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-10 py-24 px-8 sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                        Security Alert
                    </span>
                    <h1 className="max-w-xl text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 sm:text-4xl">
                        サプライチェーン脆弱性をその場で診断
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
                        外部スクリプト（polyfill.io 型攻撃）と npm
                        パッケージ（既知CVE・侵害履歴）の両面から、貼り付けたコードを解析します。
                    </p>
                </div>
                <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
                    <Link
                        href="/scan"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] sm:w-auto"
                    >
                        スクリプト スキャナ
                    </Link>
                    <Link
                        href="/scan/packages"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] sm:w-auto"
                    >
                        パッケージ スキャナ
                    </Link>
                </div>
            </main>
        </div>
    );
}
