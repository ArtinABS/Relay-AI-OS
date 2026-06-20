import { NextResponse } from "next/server";
import { z } from "zod";

import { addNote, deleteNote, listNotes, searchNotes } from "@/lib/local-store/notes";

const noteActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    body: z.string().min(1),
  }),
  z.object({
    action: z.literal("search"),
    query: z.string().min(1),
  }),
  z.object({
    action: z.literal("delete"),
    identifier: z.string().min(1),
  }),
]);

export async function GET() {
  return NextResponse.json({ notes: await listNotes() });
}

export async function POST(request: Request) {
  const body = noteActionSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid note action.", details: body.error.flatten() },
      { status: 400 },
    );
  }

  if (body.data.action === "add") {
    return NextResponse.json({ note: await addNote(body.data.body) });
  }

  if (body.data.action === "search") {
    return NextResponse.json({ notes: await searchNotes(body.data.query) });
  }

  const note = await deleteNote(body.data.identifier);
  return NextResponse.json({ note, found: Boolean(note) });
}
