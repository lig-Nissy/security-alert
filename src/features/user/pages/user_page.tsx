import { UserCard } from "@/features/user/components/user_card";

export function UserPage() {
    return (
        <main>
            <h1>User</h1>
            <UserCard user={{ id: "1", firstName: "太郎", lastName: "山田" }} />
        </main>
    );
}
