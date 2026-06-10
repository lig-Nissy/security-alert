import { useState } from "react";
import type { User } from "@/features/user/types/user";

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    return { user, setUser };
}
