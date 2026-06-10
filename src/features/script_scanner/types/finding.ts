export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingCategory =
    | "compromised_domain"
    | "missing_sri"
    | "unpinned_version"
    | "untrusted_cdn"
    | "info";

export type Finding = {
    category: FindingCategory;
    severity: Severity;
    title: string;
    description: string;
    recommendation: string;
    source: {
        url: string;
        lineNumber: number;
    };
    reference?: {
        label: string;
        url: string;
    };
};

export type ScanResult = {
    scriptsFound: number;
    findings: Finding[];
    scannedAt: string;
};
