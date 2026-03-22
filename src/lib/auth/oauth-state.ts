import { randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const OAUTH_STATE_COOKIE_NAMES = {
  github: "geno_oauth_state_github",
  google: "geno_oauth_state_google"
} as const;

type OAuthProvider = keyof typeof OAUTH_STATE_COOKIE_NAMES;

export function createOAuthState() {
  return randomBytes(16).toString("hex");
}

export function getOAuthStateCookieName(provider: OAuthProvider) {
  return OAUTH_STATE_COOKIE_NAMES[provider];
}

export function buildOAuthStateCookie(provider: OAuthProvider, value: string) {
  return {
    name: getOAuthStateCookieName(provider),
    value,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10
  };
}

export function buildExpiredOAuthStateCookie(provider: OAuthProvider) {
  return {
    name: getOAuthStateCookieName(provider),
    value: "",
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(0)
  };
}
