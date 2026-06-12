"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/app/lib/api-client";
import type { UserRole } from "@/auth";

export async function updateUserRole(userId: string, role: UserRole) {
  await apiFetch(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  revalidatePath("/admin/users");
}
