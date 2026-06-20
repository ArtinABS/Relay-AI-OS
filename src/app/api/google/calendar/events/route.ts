import { NextResponse } from "next/server";
import { z } from "zod";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import {
  createCalendarEventForUser,
  getUpcomingCalendarEventsForUser,
  updateCalendarEventForUser,
} from "@/lib/google/workspace";

const createEventSchema = z.object({
  summary: z.string().min(1),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  timeZone: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  conferenceData: z.boolean().default(false),
  reminderMinutes: z.number().int().min(0).max(40320).nullable().optional(),
});

const updateEventSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  timeZone: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  reminderMinutes: z.number().int().min(0).max(40320).nullable().optional(),
});

export async function GET() {
  const tokens = await getDirectGoogleTokens();

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Calendar is not connected.",
        events: [],
      },
      { status: 412 },
    );
  }

  try {
    const result = await getUpcomingCalendarEventsForUser(tokens, 10);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read Google Calendar events.",
        events: [],
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const parsed = createEventSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Calendar event details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Calendar is not connected.",
      },
      { status: 412 },
    );
  }

  try {
    const result = await createCalendarEventForUser(tokens, parsed.data);
    return NextResponse.json(result, { status: result.ok ? 201 : 412 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to create the Google Calendar event.",
      },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const parsed = updateEventSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Calendar event update details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Calendar is not connected.",
      },
      { status: 412 },
    );
  }

  try {
    const result = await updateCalendarEventForUser(tokens, parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 412 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to update the Google Calendar event.",
      },
      { status: 502 },
    );
  }
}
