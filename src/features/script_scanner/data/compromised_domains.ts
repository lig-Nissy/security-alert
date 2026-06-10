export type CompromisedDomain = {
    domain: string;
    description: string;
    reference: {
        label: string;
        url: string;
    };
};

export const COMPROMISED_DOMAINS: CompromisedDomain[] = [
    {
        domain: "polyfill.io",
        description:
            "2024年6月、新所有者により悪意あるコードが配信されるサプライチェーン攻撃が発生。",
        reference: {
            label: "Sansec: Polyfill supply chain attack",
            url: "https://sansec.io/research/polyfill-supply-chain-attack",
        },
    },
    {
        domain: "cdn.polyfill.io",
        description:
            "polyfill.ioのCDNサブドメイン。2024年に悪意あるリダイレクト・コード配信が確認された。",
        reference: {
            label: "Sansec: Polyfill supply chain attack",
            url: "https://sansec.io/research/polyfill-supply-chain-attack",
        },
    },
    {
        domain: "polyfill.com",
        description: "polyfill.ioと同じ運営者が取得したと報じられたドメイン。同様のリスクあり。",
        reference: {
            label: "Cloudflare blog on polyfill.io",
            url: "https://blog.cloudflare.com/polyfill-io-now-available-on-cdnjs-reduce-your-supply-chain-risk",
        },
    },
    {
        domain: "bootcss.com",
        description: "2023年に同系列のドメインで不審な挙動が報告されたCDN。利用は推奨されない。",
        reference: {
            label: "Sansec research",
            url: "https://sansec.io/research/polyfill-supply-chain-attack",
        },
    },
    {
        domain: "bootcdn.net",
        description: "bootcss.com 系列のCDN。同じく注意が必要。",
        reference: {
            label: "Sansec research",
            url: "https://sansec.io/research/polyfill-supply-chain-attack",
        },
    },
    {
        domain: "staticfile.org",
        description: "bootcss.com 系列のCDN。供給元の信頼性に懸念あり。",
        reference: {
            label: "Sansec research",
            url: "https://sansec.io/research/polyfill-supply-chain-attack",
        },
    },
    {
        domain: "staticfile.net",
        description: "staticfile.org 系列のCDN。同じく注意が必要。",
        reference: {
            label: "Sansec research",
            url: "https://sansec.io/research/polyfill-supply-chain-attack",
        },
    },
    {
        domain: "unionadjs.com",
        description: "polyfill.io攻撃で観測されたペイロード配信ドメイン。",
        reference: {
            label: "Sansec: Polyfill supply chain attack",
            url: "https://sansec.io/research/polyfill-supply-chain-attack",
        },
    },
];

export function findCompromisedDomain(host: string): CompromisedDomain | null {
    const lower = host.toLowerCase();
    return (
        COMPROMISED_DOMAINS.find(
            (entry) => lower === entry.domain || lower.endsWith(`.${entry.domain}`),
        ) ?? null
    );
}
