type SampleButtonProps = {
    label: string;
    onClick?: () => void;
};

export function SampleButton({ label, onClick }: SampleButtonProps) {
    return (
        <button type="button" onClick={onClick}>
            {label}
        </button>
    );
}
