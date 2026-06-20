import { NextResponse } from "next/server";
import { z } from "zod";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import {
  completeGoogleTaskForUser,
  createGoogleTaskForUser,
  deleteGoogleTaskForUser,
  listGoogleTasksForUser,
  updateGoogleTaskForUser,
} from "@/lib/google/workspace";

const prioritySchema = z.enum(["high", "medium", "low"]);

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    title: z.string().min(1),
    notes: z.string().optional(),
    due: z.string().datetime().nullable().optional(),
    taskListId: z.string().nullable().optional(),
    priority: prioritySchema.optional(),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().min(1),
    title: z.string().min(1).optional(),
    notes: z.string().optional(),
    due: z.string().datetime().nullable().optional(),
    status: z.enum(["needsAction", "completed"]).optional(),
    taskListId: z.string().nullable().optional(),
    priority: prioritySchema.optional(),
  }),
  z.object({
    action: z.literal("complete"),
    id: z.string().min(1),
    taskListId: z.string().nullable().optional(),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string().min(1),
    taskListId: z.string().nullable().optional(),
  }),
]);

export async function GET() {
  const tokens = await getDirectGoogleTokens();

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Tasks is not connected.",
        taskLists: [],
        tasks: [],
      },
      { status: 412 },
    );
  }

  try {
    return NextResponse.json(await listGoogleTasksForUser(tokens, 25));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error ? error.message : "Unable to read Google Tasks.",
        taskLists: [],
        tasks: [],
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
        reason: "Google task details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Tasks is not connected.",
      },
      { status: 412 },
    );
  }

  try {
    if (parsed.data.action === "create") {
      const result = await createGoogleTaskForUser(tokens, parsed.data);
      return NextResponse.json(result, { status: result.ok ? 201 : 412 });
    }

    if (parsed.data.action === "update") {
      const result = await updateGoogleTaskForUser(tokens, parsed.data);
      return NextResponse.json(result, { status: result.ok ? 200 : 412 });
    }

    if (parsed.data.action === "complete") {
      const result = await completeGoogleTaskForUser(tokens, parsed.data);
      return NextResponse.json(result, { status: result.ok ? 200 : 412 });
    }

    const result = await deleteGoogleTaskForUser(tokens, parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 412 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error ? error.message : "Unable to update Google Tasks.",
      },
      { status: 502 },
    );
  }
}
