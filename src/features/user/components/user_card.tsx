import type { User } from "@/features/user/types/user";

export function UserCard({ user }: { user: User }) {
    return (
        <div>
            <p>
                {user.lastName} {user.firstName}
            </p>
        </div>
    );
}
