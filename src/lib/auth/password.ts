import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { createLocalId, readJsonFile, writeJsonFile } from "@/lib/local-store/store";

const scrypt = promisify(scryptCallback);
const usersFile = "password-users.json";
export const passwordSessionCookieName = "relay_password_session";

export type PasswordUser = {
  id: string;
  email: string;
  name?: string | null;
  passwordHash: string;
  passwordSalt: string;
  emailVerified: boolean;
  verificationCodeHash?: string | null;
  verificationExpiresAt?: string | null;
  resetCodeHash?: string | null;
  resetExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
};

export type PublicPasswordUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
};

type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

function authSecret() {
  return process.env.NEXTAUTH_SECRET ?? "relay-local-development-secret";
}

function appUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function codeHash(code: string) {
  return sign(code.trim());
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashPassword(password: string, salt = randomBytes(16).toString("base64url")) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return {
    salt,
    hash: derived.toString("base64url"),
  };
}

async function verifyPassword(password: string, user: PasswordUser) {
  const { hash } = await hashPassword(password, user.passwordSalt);
  const left = Buffer.from(hash, "base64url");
  const right = Buffer.from(user.passwordHash, "base64url");
  return left.length === right.length && timingSafeEqual(left, right);
}

async function listPasswordUsers() {
  return readJsonFile<PasswordUser[]>(usersFile, []);
}

async function writePasswordUsers(users: PasswordUser[]) {
  await writeJsonFile(usersFile, users);
}

function publicUser(user: PasswordUser): PublicPasswordUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    emailVerified: user.emailVerified,
  };
}

async function updateUser(
  email: string,
  updater: (user: PasswordUser) => PasswordUser,
) {
  const users = await listPasswordUsers();
  const normalized = normalizeEmail(email);
  const index = users.findIndex((user) => user.email === normalized);
  if (index < 0) return null;

  const nextUser = updater(users[index]);
  const nextUsers = [...users];
  nextUsers[index] = nextUser;
  await writePasswordUsers(nextUsers);
  return nextUser;
}

export async function createPasswordUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const users = await listPasswordUsers();
  const email = normalizeEmail(input.email);

  if (users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  const password = await hashPassword(input.password);
  const code = generateCode();
  const now = new Date().toISOString();
  const user: PasswordUser = {
    id: createLocalId("user"),
    email,
    name: input.name?.trim() || null,
    passwordHash: password.hash,
    passwordSalt: password.salt,
    emailVerified: false,
    verificationCodeHash: codeHash(code),
    verificationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };

  await writePasswordUsers([user, ...users]);
  return {
    user: publicUser(user),
    verificationCode: code,
  };
}

export async function issueVerificationCode(email: string) {
  const code = generateCode();
  const user = await updateUser(email, (current) => ({
    ...current,
    verificationCodeHash: codeHash(code),
    verificationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return user ? { user: publicUser(user), verificationCode: code } : null;
}

export async function verifyEmailCode(email: string, code: string) {
  const users = await listPasswordUsers();
  const currentUser = users.find((user) => user.email === normalizeEmail(email));
  if (!currentUser) {
    throw new Error("Invalid or expired verification code.");
  }

  const expiresAt = currentUser.verificationExpiresAt
    ? new Date(currentUser.verificationExpiresAt).getTime()
    : 0;
  const valid =
    currentUser.verificationCodeHash === codeHash(code) && expiresAt > Date.now();

  if (!valid) {
    throw new Error("Invalid or expired verification code.");
  }

  const user = await updateUser(email, (current) => {
    const expiresAt = current.verificationExpiresAt
      ? new Date(current.verificationExpiresAt).getTime()
      : 0;
    const valid =
      current.verificationCodeHash === codeHash(code) && expiresAt > Date.now();

    if (!valid) return current;

    return {
      ...current,
      emailVerified: true,
      verificationCodeHash: null,
      verificationExpiresAt: null,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!user?.emailVerified) {
    throw new Error("Invalid or expired verification code.");
  }

  return publicUser(user);
}

export async function authenticatePassword(email: string, password: string) {
  const users = await listPasswordUsers();
  const user = users.find((item) => item.email === normalizeEmail(email));

  if (!user || !(await verifyPassword(password, user))) {
    throw new Error("Invalid email or password.");
  }

  if (!user.emailVerified) {
    const verification = await issueVerificationCode(user.email);
    return {
      ok: false as const,
      verificationRequired: true,
      user: publicUser(user),
      verificationCode: verification?.verificationCode,
    };
  }

  const updated = await updateUser(user.email, (current) => ({
    ...current,
    lastLoginAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    ok: true as const,
    user: publicUser(updated ?? user),
  };
}

export async function issueResetCode(email: string) {
  const code = generateCode();
  const user = await updateUser(email, (current) => ({
    ...current,
    resetCodeHash: codeHash(code),
    resetExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return user ? { user: publicUser(user), resetCode: code } : null;
}

export async function resetPassword(email: string, code: string, password: string) {
  const users = await listPasswordUsers();
  const currentUser = users.find((user) => user.email === normalizeEmail(email));
  if (!currentUser) {
    throw new Error("Invalid or expired reset code.");
  }

  const expiresAt = currentUser.resetExpiresAt
    ? new Date(currentUser.resetExpiresAt).getTime()
    : 0;
  const valid =
    currentUser.resetCodeHash === codeHash(code) && expiresAt > Date.now();

  if (!valid) {
    throw new Error("Invalid or expired reset code.");
  }

  const passwordResult = await hashPassword(password);
  const user = await updateUser(email, (current) => {
    const expiresAt = current.resetExpiresAt
      ? new Date(current.resetExpiresAt).getTime()
      : 0;
    const valid = current.resetCodeHash === codeHash(code) && expiresAt > Date.now();

    if (!valid) return current;

    return {
      ...current,
      passwordHash: passwordResult.hash,
      passwordSalt: passwordResult.salt,
      resetCodeHash: null,
      resetExpiresAt: null,
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!user) {
    throw new Error("Invalid or expired reset code.");
  }

  return publicUser(user);
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  const users = await listPasswordUsers();
  const currentUser = users.find((user) => user.email === normalizeEmail(email));

  if (!currentUser || !(await verifyPassword(currentPassword, currentUser))) {
    throw new Error("Current password is incorrect.");
  }

  const passwordResult = await hashPassword(newPassword);
  const user = await updateUser(email, (current) => ({
    ...current,
    passwordHash: passwordResult.hash,
    passwordSalt: passwordResult.salt,
    updatedAt: new Date().toISOString(),
  }));

  if (!user) {
    throw new Error("Unable to update password.");
  }

  return publicUser(user);
}

export function createPasswordSessionToken(user: PublicPasswordUser, remember = true) {
  const maxAgeSeconds = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = base64Url(JSON.stringify(payload));
  return {
    token: `${encoded}.${sign(encoded)}`,
    maxAgeSeconds,
  };
}

export function setPasswordSessionCookie(
  response: NextResponse,
  user: PublicPasswordUser,
  remember = true,
) {
  const session = createPasswordSessionToken(user, remember);
  response.cookies.set({
    name: passwordSessionCookieName,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl().startsWith("https://"),
    path: "/",
    maxAge: session.maxAgeSeconds,
  });
}

export async function getPasswordSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(passwordSessionCookieName)?.value;
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    const users = await listPasswordUsers();
    const user = users.find(
      (item) => item.id === payload.sub && item.email === payload.email,
    );
    return user && user.emailVerified ? publicUser(user) : null;
  } catch {
    return null;
  }
}
