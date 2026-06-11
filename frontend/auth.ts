import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Augment Session เพื่อให้ TypeScript รู้จัก accessToken และ error
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: "RefreshAccessTokenError";
  }
}

// token ที่เราเก็บเพิ่มใน JWT (extends Record<string, unknown>)
interface AppToken {
  accessToken?: string;
  expiresAt?: number;
  refreshToken?: string;
  error?: "RefreshAccessTokenError";
}

async function refreshAccessToken(refreshToken: string): Promise<AppToken> {
  const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.match(
    /microsoftonline\.com\/([^/]+)/,
  )?.[1];

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
        client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    },
  );

  if (!response.ok) throw new Error("Failed to refresh token");

  const tokens = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  return {
    accessToken: tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    refreshToken: tokens.refresh_token ?? refreshToken,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      // AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/<tenantId>/v2.0
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: {
        params: {
          // offline_access จำเป็นสำหรับขอ refresh_token จาก Microsoft
          // ขอ scope ของ API ตัวเอง (Expose an API) เพื่อให้ access token
          // มี audience เป็น backend ของเรา — ห้ามผสม scope ของ Graph
          // (เช่น User.Read) เพราะ token หนึ่งใบออกให้ได้ทีละ resource เดียว
          scope: `openid profile email offline_access api://${process.env.AUTH_MICROSOFT_ENTRA_ID_ID}/access_as_user`,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const t = token as AppToken;

      // Login ครั้งแรก — เก็บ token ทั้งหมด
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          refreshToken: account.refresh_token,
        };
      }

      // Token ยังไม่หมดอายุ
      if (t.expiresAt && Date.now() < t.expiresAt * 1000) {
        return token;
      }

      // Token หมดอายุ — refresh
      if (!t.refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" as const };
      }

      try {
        const refreshed = await refreshAccessToken(t.refreshToken);
        return { ...token, ...refreshed, error: undefined };
      } catch {
        return { ...token, error: "RefreshAccessTokenError" as const };
      }
    },

    async session({ session, token }) {
      const t = token as AppToken;
      session.accessToken = t.accessToken;
      session.error = t.error;
      return session;
    },
  },
});
