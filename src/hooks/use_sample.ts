import { useState } from "react";

export function useSample(initial = 0) {
    const [value, setValue] = useState(initial);
    return { value, setValue };
}
