import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getWorkspaceAccount } from "@/lib/auth/workspace-account";
import { readJsonFile, writeJsonFile } from "@/lib/local-store/store";

const projectStatusSchema = z.enum([
  "planning",
  "active",
  "on-hold",
  "completed",
]);
const projectPrioritySchema = z.enum(["low", "medium", "high"]);
const projectCategoryIconSchema = z.enum([
  "book",
  "briefcase",
  "code",
  "fitness",
  "folder",
  "globe",
  "heart",
  "home",
  "palette",
  "plane",
  "rocket",
  "shopping",
  "sparkles",
  "target",
  "users",
]);
const projectSchema = z.object({
  archived: z.boolean(),
  categoryId: z.string().nullable(),
  color: z.string().regex(/^#[\da-f]{6}$/i),
  createdAt: z.string(),
  dueDate: z.string().nullable(),
  favorite: z.boolean(),
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  priority: projectPrioritySchema,
  status: projectStatusSchema,
  summary: z.string().max(500),
  updatedAt: z.string(),
});
const projectCategorySchema = z.object({
  icon: projectCategoryIconSchema,
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  parentId: z.string().nullable(),
});
const projectNoteSchema = z.object({
  body: z.string().min(1),
  createdAt: z.string(),
  id: z.string().min(1),
  projectId: z.string().min(1),
  section: z.enum(["brief", "research", "decisions", "updates"]),
  updatedAt: z.string(),
});
const localProjectTaskSchema = z.object({
  completed: z.boolean(),
  createdAt: z.string(),
  dueDate: z.string().nullable(),
  id: z.string().min(1),
  priority: projectPrioritySchema,
  projectId: z.string().min(1),
  title: z.string().min(1),
});

const projectRecordSchema = z.object({
  store: z.object({
    projects: z.array(projectSchema),
    categories: z.array(projectCategorySchema),
    notes: z.array(projectNoteSchema),
    localTasks: z.array(localProjectTaskSchema),
    taskAssignments: z.record(z.string(), z.string()),
    repositoryAssignments: z
      .record(z.string(), z.array(z.string()))
      .optional()
      .default({}),
  }),
  layout: z.object({
    calendarExpanded: z.boolean().optional().default(true),
    calendarHeight: z.number().min(170).max(400),
    categoryWidth: z.number().min(170).max(320),
    projectRailWidth: z.number().min(220).max(420),
  }),
  version: z.literal(1),
});

type ProjectRecord = z.infer<typeof projectRecordSchema>;

function accountProjectFile(accountId: string) {
  const digest = createHash("sha256")
    .update(accountId)
    .digest("hex")
    .slice(0, 24);
  return `projects-${digest}.json`;
}

export async function GET() {
  const account = await getWorkspaceAccount();
  if (!account) {
    return NextResponse.json({ account: null, record: null });
  }

  const record = await readJsonFile<ProjectRecord | null>(
    accountProjectFile(account.id),
    null,
  );
  const parsedRecord = record ? projectRecordSchema.safeParse(record) : null;

  return NextResponse.json({
    account: { label: account.label, provider: account.provider },
    record: parsedRecord?.success ? parsedRecord.data : null,
  });
}

export async function PUT(request: Request) {
  const account = await getWorkspaceAccount();
  if (!account) {
    return NextResponse.json(
      { error: "Sign in before syncing project data." },
      { status: 401 },
    );
  }

  const parsed = projectRecordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project data.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await writeJsonFile(accountProjectFile(account.id), parsed.data);
  return NextResponse.json({ ok: true });
}
