import { NextResponse } from "next/server";

import { projectRecordSchema } from "@/lib/projects/model";
import {
  readAccountProjectRecord,
  writeAccountProjectRecord,
} from "@/lib/projects/persistence";

export async function GET() {
  const { account, record } = await readAccountProjectRecord();
  if (!account) {
    return NextResponse.json({ account: null, record: null });
  }

  return NextResponse.json({
    account: { label: account.label, provider: account.provider },
    record,
  });
}

export async function PUT(request: Request) {
  const parsed = projectRecordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project data.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await writeAccountProjectRecord(parsed.data);
  if (!result.account) {
    return NextResponse.json(
      { error: "Sign in before syncing project data." },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}
