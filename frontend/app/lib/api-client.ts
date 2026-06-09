import { auth } from "@/auth";
import { signIn } from "@/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

/**
 * Server-side fetch — ใช้ใน Server Components / Route Handlers / Server Actions
 * แนบ access token ให้อัตโนมัติ
 */
export async function apiFetch(path: string, options: RequestOptions = {}) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthenticated");
  }

  if (session.error === "RefreshAccessTokenError") {
    // refresh token หมดอายุแล้ว บังคับ login ใหม่
    await signIn("microsoft-entra-id");
    return;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  return response.json();
}
