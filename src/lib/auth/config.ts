import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { googleWorkspaceScopeString } from "@/lib/google/scopes";

export const hasGoogleOAuthConfig = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: hasGoogleOAuthConfig
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          authorization: {
            params: {
              access_type: "offline",
              prompt: "consent",
              response_type: "code",
              scope: googleWorkspaceScopeString,
            },
          },
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token ?? token.refreshToken;
        token.expiresAt = account.expires_at;
      }

      return token;
    },
    async session({ session, token }) {
      session.google = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
      };

      return session;
    },
  },
};
