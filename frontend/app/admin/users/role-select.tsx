"use client";

import { useTransition } from "react";
import type { UserRole } from "@/auth";
import { updateUserRole } from "./actions";

export default function RoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={isPending}
      onChange={(e) => {
        const newRole = e.target.value as UserRole;
        startTransition(() => {
          updateUserRole(userId, newRole);
        });
      }}
      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="staff">staff</option>
      <option value="admin">admin</option>
    </select>
  );
}
