"use client";

import { createContext, useContext, type ReactNode } from "react";

const SampleContext = createContext<string>("");

export function SampleProvider({ children }: { children: ReactNode }) {
    return <SampleContext.Provider value="sample">{children}</SampleContext.Provider>;
}

export function useSampleContext() {
    return useContext(SampleContext);
}
