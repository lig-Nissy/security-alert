"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { User } from "@/features/user/types/user";

const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
    return <UserContext.Provider value={null}>{children}</UserContext.Provider>;
}

export function useUserContext() {
    return useContext(UserContext);
}
