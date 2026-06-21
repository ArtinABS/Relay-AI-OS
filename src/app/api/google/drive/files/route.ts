import { NextResponse } from "next/server";
import { z } from "zod";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import {
  copyDriveFileForUser,
  deleteDriveFileForUser,
  getDriveFileForUser,
  listRecentDriveFilesForUser,
  moveDriveFileForUser,
  readDriveFileTextForUser,
  renameDriveFileForUser,
  setDriveFileTrashedForUser,
  shareDriveFileForUser,
} from "@/lib/google/workspace";

const driveActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("read"),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("readText"),
    id: z.string().min(1),
    maxCharacters: z.number().int().min(500).max(20000).optional(),
  }),
  z.object({
    action: z.literal("rename"),
    id: z.string().min(1),
    name: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("move"),
    id: z.string().min(1),
    folderId: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("copy"),
    id: z.string().min(1),
    name: z.string().optional(),
    folderId: z.string().nullable().optional(),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("trash"),
    id: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("restore"),
    id: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("share"),
    id: z.string().min(1),
    role: z.enum(["reader", "commenter", "writer"]),
    type: z.enum(["user", "group", "domain", "anyone"]),
    emailAddress: z.string().email().optional(),
    domain: z.string().optional(),
    allowFileDiscovery: z.boolean().optional(),
    confirmed: z.boolean().default(false),
  }),
]);

export async function GET(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || undefined;

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Drive is not connected.",
        files: [],
      },
      { status: 412 },
    );
  }

  try {
    const result = await listRecentDriveFilesForUser(tokens, query ? 20 : 10, query);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read Google Drive files.",
        files: [],
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const parsed = driveActionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Drive action details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Drive is not connected.",
      },
      { status: 412 },
    );
  }

  const action = parsed.data;
  const needsConfirmation = !["read", "readText"].includes(action.action);
  if (needsConfirmation && !("confirmed" in action && action.confirmed)) {
    return NextResponse.json(
      { ok: false, reason: `Drive ${action.action} requires confirmation.` },
      { status: 409 },
    );
  }

  try {
    if (action.action === "read") {
      return NextResponse.json(await getDriveFileForUser(tokens, action.id));
    }

    if (action.action === "readText") {
      return NextResponse.json(await readDriveFileTextForUser(tokens, action));
    }

    if (action.action === "rename") {
      return NextResponse.json(await renameDriveFileForUser(tokens, action));
    }

    if (action.action === "move") {
      return NextResponse.json(await moveDriveFileForUser(tokens, action));
    }

    if (action.action === "copy") {
      return NextResponse.json(await copyDriveFileForUser(tokens, action), { status: 201 });
    }

    if (action.action === "trash") {
      return NextResponse.json(
        await setDriveFileTrashedForUser(tokens, { id: action.id, trashed: true }),
      );
    }

    if (action.action === "restore") {
      return NextResponse.json(
        await setDriveFileTrashedForUser(tokens, { id: action.id, trashed: false }),
      );
    }

    if (action.action === "share") {
      return NextResponse.json(await shareDriveFileForUser(tokens, action));
    }

    return NextResponse.json(await deleteDriveFileForUser(tokens, action.id));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to complete Google Drive action.",
      },
      { status: 502 },
    );
  }
}
