export type Ecosystem = "npm";

export type PackageRef = {
    name: string;
    version: string;
    ecosystem: Ecosystem;
    source: "package.json" | "package-lock.json" | "yarn.lock" | "pnpm-lock.yaml";
    location:
        | "dependencies"
        | "devDependencies"
        | "peerDependencies"
        | "optionalDependencies"
        | "resolved";
};
