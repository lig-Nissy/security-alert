import type { User } from "@/features/user/types/user";

export function formatUserName(user: User): string {
    return `${user.lastName} ${user.firstName}`;
}
