import type { PackageRef } from "@/features/package_scanner/types/package";
import type { PackageFinding, Vulnerability } from "@/features/package_scanner/types/vulnerability";
import { findCompromisedPackage } from "@/features/package_scanner/data/compromised_packages";
import {
    fetchOsvVuln,
    queryOsvBatch,
    toVulnerability,
} from "@/features/package_scanner/utils/osv_client";

const BATCH_SIZE = 100;
const VULN_DETAIL_CONCURRENCY = 4;
const MAX_PACKAGES = 1500;

async function pMap<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (true) {
            const index = cursor++;
            if (index >= items.length) return;
            results[index] = await mapper(items[index]);
        }
    });
    await Promise.all(workers);
    return results;
}

async function safeFetchVuln(id: string): Promise<Vulnerability> {
    try {
        const detail = await fetchOsvVuln(id);
        return toVulnerability(detail, "");
    } catch {
        return {
            id,
            summary: `${id} (詳細取得に失敗)`,
            severity: "unknown",
            aliases: [],
            references: [{ type: "ADVISORY", url: `https://osv.dev/vulnerability/${id}` }],
        };
    }
}

export async function POST(request: Request) {
    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const refs = (payload as { refs?: PackageRef[] })?.refs;
    if (!Array.isArray(refs) || refs.length === 0) {
        return Response.json({ error: "refs is required" }, { status: 400 });
    }
    if (refs.length > MAX_PACKAGES) {
        return Response.json(
            {
                error: `パッケージ数が多すぎます (${refs.length}件)。上限は ${MAX_PACKAGES} 件です。`,
            },
            { status: 400 },
        );
    }

    try {
        const findings: PackageFinding[] = [];

        for (let i = 0; i < refs.length; i += BATCH_SIZE) {
            const chunk = refs.slice(i, i + BATCH_SIZE);
            const batch = await queryOsvBatch(chunk);
            for (let j = 0; j < chunk.length; j++) {
                const ref = chunk[j];
                const vulnIds = batch.results[j]?.vulns?.map((v) => v.id) ?? [];
                const compromised = findCompromisedPackage(ref.name);
                const compromisedNotice = compromised
                    ? { description: compromised.description, reference: compromised.reference }
                    : undefined;

                if (vulnIds.length === 0 && !compromised) continue;

                const vulnerabilities = await pMap(vulnIds, VULN_DETAIL_CONCURRENCY, async (id) => {
                    try {
                        const detail = await fetchOsvVuln(id);
                        return toVulnerability(detail, ref.name);
                    } catch {
                        return (await safeFetchVuln(id)) satisfies Vulnerability;
                    }
                });

                findings.push({
                    package: ref,
                    vulnerabilities,
                    compromisedNotice,
                });
            }
        }

        const totalVulnerabilities = findings.reduce((acc, f) => acc + f.vulnerabilities.length, 0);

        return Response.json({
            packagesScanned: refs.length,
            vulnerablePackages: findings.length,
            totalVulnerabilities,
            findings,
            scannedAt: new Date().toISOString(),
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return Response.json(
            { error: `OSV.dev への照会中にエラーが発生しました: ${message}` },
            { status: 502 },
        );
    }
}
