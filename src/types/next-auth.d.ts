import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    google?: {
      accessToken?: unknown;
      refreshToken?: unknown;
      expiresAt?: unknown;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: unknown;
    refreshToken?: unknown;
    expiresAt?: unknown;
  }
}
