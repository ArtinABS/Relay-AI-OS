import { NextResponse } from "next/server";
import { z } from "zod";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import {
  createGoogleContactForUser,
  deleteGoogleContactForUser,
  getGoogleContactForUser,
  listGoogleContactsForUser,
  updateGoogleContactForUser,
} from "@/lib/google/workspace";

const contactInputSchema = z.object({
  displayName: z.string().optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  organization: z.string().optional(),
  jobTitle: z.string().optional(),
  birthday: z
    .string()
    .regex(/^(\d{4}-)?\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional(),
  address: z.string().optional(),
});

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("read"),
    resourceName: z.string().min(1),
  }),
  z.object({
    action: z.literal("create"),
    contact: contactInputSchema,
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("update"),
    resourceName: z.string().min(1),
    contact: contactInputSchema,
    confirmed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("delete"),
    resourceName: z.string().min(1),
    confirmed: z.boolean().default(false),
  }),
]);

export async function GET(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const maxResults = Number(url.searchParams.get("maxResults") ?? 25);

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Contacts is not connected.",
        contacts: [],
      },
      { status: 412 },
    );
  }

  try {
    return NextResponse.json(
      await listGoogleContactsForUser(tokens, {
        query,
        maxResults: Number.isFinite(maxResults)
          ? Math.min(Math.max(maxResults, 1), 100)
          : 25,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error ? error.message : "Unable to read Google Contacts.",
        contacts: [],
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
        reason: "Google contact action details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Contacts is not connected.",
      },
      { status: 412 },
    );
  }

  try {
    if (parsed.data.action === "read") {
      return NextResponse.json(
        await getGoogleContactForUser(tokens, parsed.data.resourceName),
      );
    }

    if (parsed.data.action === "create") {
      if (!parsed.data.confirmed) {
        return NextResponse.json(
          { ok: false, reason: "Creating a Google Contact requires confirmation." },
          { status: 409 },
        );
      }

      const result = await createGoogleContactForUser(tokens, parsed.data.contact);
      return NextResponse.json(result, { status: result.ok ? 201 : 412 });
    }

    if (parsed.data.action === "update") {
      if (!parsed.data.confirmed) {
        return NextResponse.json(
          { ok: false, reason: "Editing a Google Contact requires confirmation." },
          { status: 409 },
        );
      }

      const result = await updateGoogleContactForUser(tokens, {
        resourceName: parsed.data.resourceName,
        ...parsed.data.contact,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 412 });
    }

    if (!parsed.data.confirmed) {
      return NextResponse.json(
        { ok: false, reason: "Deleting a Google Contact requires confirmation." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      await deleteGoogleContactForUser(tokens, parsed.data.resourceName),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to complete Google Contacts action.",
      },
      { status: 502 },
    );
  }
}
