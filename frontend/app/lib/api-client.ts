import { auth } from "@/auth";
import { signIn } from "@/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function getAccessToken(): Promise<string> {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthenticated");
  }

  if (session.error === "RefreshAccessTokenError" || !session.accessToken) {
    // refresh token หมดอายุแล้ว บังคับ login ใหม่
    await signIn("microsoft-entra-id");
    throw new Error("Session expired");
  }

  return session.accessToken;
}

/**
 * Server-side fetch — ใช้ใน Server Components / Route Handlers / Server Actions
 * แนบ access token ให้อัตโนมัติ
 */
export async function apiFetch(path: string, options: RequestOptions = {}) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await formatApiError(response));
  }

  return response.json();
}

/**
 * แปลง error response จาก backend ให้เป็นข้อความที่อ่านง่าย
 * ไม่โชว์ raw JSON / zod validation error ดิบๆ ให้ผู้ใช้เห็น
 */
async function formatApiError(response: Response): Promise<string> {
  const text = await response.text();

  try {
    const body = JSON.parse(text);
    if (typeof body.message === "string") {
      const jsonStart = body.message.indexOf("[");
      const message =
        jsonStart === -1 ? body.message : body.message.slice(0, jsonStart).trim();
      return message || `API error ${response.status}`;
    }
  } catch {
    // ไม่ใช่ JSON ปล่อยให้ใช้ text เดิม
  }

  return `API error ${response.status}: ${text}`;
}

/**
 * Server-side multipart upload — ส่ง FormData ไป backend
 * ห้าม set Content-Type เอง เพื่อให้ fetch ใส่ multipart boundary ให้
 */
export async function apiUpload(path: string, formData: FormData) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await formatApiError(response));
  }

  return response.json();
}
