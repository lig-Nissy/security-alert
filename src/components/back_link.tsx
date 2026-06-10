import Link from "next/link";

type Props = {
    href?: string;
    label?: string;
};

export function BackLink({ href = "/", label = "トップへ戻る" }: Props) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
            <span aria-hidden="true">←</span>
            {label}
        </Link>
    );
}
