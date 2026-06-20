import { NextResponse } from "next/server";
import { z } from "zod";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import {
  archiveGmailMessageForUser,
  createGmailDraftForUser,
  deleteGmailMessageForUser,
  labelGmailMessageForUser,
  listGmailMessagesForUser,
  readGmailMessageForUser,
  replyToGmailMessageForUser,
  sendGmailMessageForUser,
  starGmailMessageForUser,
  trashGmailMessageForUser,
} from "@/lib/google/workspace";
import { addScheduledEmail } from "@/lib/local-store/scheduled-emails";

const emailSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  threadId: z.string().nullable().optional(),
});

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("read"),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("draft"),
    email: emailSchema,
  }),
  z.object({
    action: z.literal("send"),
    email: emailSchema,
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("reply"),
    messageId: z.string().min(1),
    body: z.string().min(1),
    to: z.string().optional(),
    subject: z.string().optional(),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("archive"),
    id: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("label"),
    id: z.string().min(1),
    label: z.string().min(1),
  }),
  z.object({
    action: z.literal("star"),
    id: z.string().min(1),
    starred: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("trash"),
    id: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("schedule"),
    email: emailSchema,
    sendAt: z.string().datetime(),
    confirmed: z.boolean().default(false),
  }),
]);

export async function GET(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const maxResults = Number(url.searchParams.get("maxResults") ?? 10);

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Gmail is not connected.",
        messages: [],
      },
      { status: 412 },
    );
  }

  try {
    return NextResponse.json(
      await listGmailMessagesForUser(tokens, {
        query,
        maxResults: Number.isFinite(maxResults) ? Math.min(Math.max(maxResults, 1), 25) : 10,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to read Gmail.",
        messages: [],
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Gmail action details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Gmail is not connected.",
      },
      { status: 412 },
    );
  }

  try {
    if (parsed.data.action === "read") {
      return NextResponse.json(await readGmailMessageForUser(tokens, parsed.data.id));
    }

    if (parsed.data.action === "draft") {
      const result = await createGmailDraftForUser(tokens, parsed.data.email);
      return NextResponse.json(result, { status: result.ok ? 201 : 412 });
    }

    if (parsed.data.action === "send") {
      if (!parsed.data.confirmed) {
        return NextResponse.json(
          { ok: false, reason: "Sending email requires explicit confirmation." },
          { status: 409 },
        );
      }
      return NextResponse.json(await sendGmailMessageForUser(tokens, parsed.data.email));
    }

    if (parsed.data.action === "reply") {
      if (!parsed.data.confirmed) {
        return NextResponse.json(
          { ok: false, reason: "Replying requires explicit confirmation." },
          { status: 409 },
        );
      }
      return NextResponse.json(await replyToGmailMessageForUser(tokens, parsed.data));
    }

    if (parsed.data.action === "archive") {
      if (!parsed.data.confirmed) {
        return NextResponse.json(
          { ok: false, reason: "Archiving email requires explicit confirmation." },
          { status: 409 },
        );
      }
      return NextResponse.json(await archiveGmailMessageForUser(tokens, parsed.data.id));
    }

    if (parsed.data.action === "label") {
      return NextResponse.json(
        await labelGmailMessageForUser(tokens, {
          id: parsed.data.id,
          label: parsed.data.label,
        }),
      );
    }

    if (parsed.data.action === "star") {
      return NextResponse.json(
        await starGmailMessageForUser(tokens, parsed.data.id, parsed.data.starred),
      );
    }

    if (parsed.data.action === "trash") {
      if (!parsed.data.confirmed) {
        return NextResponse.json(
          { ok: false, reason: "Moving email to trash requires explicit confirmation." },
          { status: 409 },
        );
      }
      return NextResponse.json(await trashGmailMessageForUser(tokens, parsed.data.id));
    }

    if (parsed.data.action === "delete") {
      if (!parsed.data.confirmed) {
        return NextResponse.json(
          { ok: false, reason: "Permanent email deletion requires explicit confirmation." },
          { status: 409 },
        );
      }
      return NextResponse.json(await deleteGmailMessageForUser(tokens, parsed.data.id));
    }

    if (!parsed.data.confirmed) {
      return NextResponse.json(
        { ok: false, reason: "Scheduling email requires explicit confirmation." },
        { status: 409 },
      );
    }

    const draft = await createGmailDraftForUser(tokens, parsed.data.email);
    if (!draft.ok) return NextResponse.json(draft, { status: 412 });

    const draftData = "draft" in draft ? draft.draft : null;
    const scheduled = await addScheduledEmail({
      draftId: draftData?.id ?? null,
      email: parsed.data.email,
      sendAt: parsed.data.sendAt,
    });

    return NextResponse.json({
      ok: true,
      scheduled,
      draft: draftData,
      note:
        "Email was saved as a Gmail draft and queued locally. Configure a background worker to send scheduled emails automatically.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to complete Gmail action.",
      },
      { status: 502 },
    );
  }
}
