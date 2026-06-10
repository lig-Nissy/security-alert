export type CompromisedPackage = {
    name: string;
    description: string;
    reference: { label: string; url: string };
};

export const COMPROMISED_NPM_PACKAGES: CompromisedPackage[] = [
    {
        name: "event-stream",
        description:
            "2018年、悪意ある依存関係 flatmap-stream が混入し、Bitcoin ウォレット情報の窃取コードが配布された事件。",
        reference: {
            label: "GitHub: event-stream incident",
            url: "https://github.com/dominictarr/event-stream/issues/116",
        },
    },
    {
        name: "flatmap-stream",
        description: "event-stream 事件で悪意あるコードが直接埋め込まれていたパッケージ。",
        reference: {
            label: "GitHub: event-stream incident",
            url: "https://github.com/dominictarr/event-stream/issues/116",
        },
    },
    {
        name: "ua-parser-js",
        description:
            "2021年、特定バージョン (0.7.29/0.8.0/1.0.0) にコインマイナーが混入。npmが当該バージョンを削除。",
        reference: {
            label: "GitHub Advisory GHSA-pjwm-rvh2-c87w",
            url: "https://github.com/advisories/GHSA-pjwm-rvh2-c87w",
        },
    },
    {
        name: "node-ipc",
        description:
            "2022年、メンテナによる地政学的な意図のあるサボタージュコードが追加された事案 (protestware)。",
        reference: {
            label: "Snyk: node-ipc malicious code",
            url: "https://snyk.io/blog/peacenotwar-malicious-npm-node-ipc-package-vulnerability/",
        },
    },
    {
        name: "coa",
        description:
            "2021年、coaのメンテナアカウントが乗っ取られ、悪意あるバージョンが公開された事案。",
        reference: {
            label: "GitHub Advisory GHSA-73qr-pfmq-6rp6",
            url: "https://github.com/advisories/GHSA-73qr-pfmq-6rp6",
        },
    },
    {
        name: "rc",
        description:
            "2021年、rcパッケージのメンテナアカウントが乗っ取られ、悪意あるバージョンが公開された事案。",
        reference: {
            label: "GitHub Advisory GHSA-g2q5-5433-rhrf",
            url: "https://github.com/advisories/GHSA-g2q5-5433-rhrf",
        },
    },
];

export function findCompromisedPackage(name: string): CompromisedPackage | null {
    const lower = name.toLowerCase();
    return COMPROMISED_NPM_PACKAGES.find((p) => p.name.toLowerCase() === lower) ?? null;
}
