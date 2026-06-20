import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addTask,
  addTaskColumn,
  clearCompletedTasks,
  completeTask,
  deleteTaskColumn,
  listTaskColumns,
  listTasks,
  moveTask,
  renameTaskColumn,
  reorderTaskColumns,
  updateTask,
} from "@/lib/local-store/tasks";

const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

const taskActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    title: z.string().min(1),
    notes: z.string().nullable().optional(),
    due: z.string().datetime().nullable().optional(),
    priority: prioritySchema.optional(),
    columnId: z.string().nullable().optional(),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().min(1),
    title: z.string().min(1).optional(),
    notes: z.string().nullable().optional(),
    due: z.string().datetime().nullable().optional(),
    priority: prioritySchema.optional(),
    columnId: z.string().nullable().optional(),
  }),
  z.object({
    action: z.literal("move"),
    id: z.string().min(1),
    columnId: z.string().min(1),
  }),
  z.object({
    action: z.literal("complete"),
    identifier: z.string().min(1),
  }),
  z.object({
    action: z.literal("add_column"),
    title: z.string().min(1),
  }),
  z.object({
    action: z.literal("rename_column"),
    id: z.string().min(1),
    title: z.string().min(1),
  }),
  z.object({
    action: z.literal("delete_column"),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("reorder_columns"),
    ids: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    action: z.literal("clear_completed"),
  }),
]);

export async function GET() {
  const [tasks, columns] = await Promise.all([listTasks(), listTaskColumns()]);
  return NextResponse.json({ tasks, columns });
}

export async function POST(request: Request) {
  const body = taskActionSchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid task action.", details: body.error.flatten() },
      { status: 400 },
    );
  }

  if (body.data.action === "add") {
    return NextResponse.json({
      task: await addTask({
        title: body.data.title,
        notes: body.data.notes,
        due: body.data.due,
        priority: body.data.priority,
        columnId: body.data.columnId,
      }),
    });
  }

  if (body.data.action === "update") {
    return NextResponse.json({
      task: await updateTask(body.data.id, {
        title: body.data.title,
        notes: body.data.notes,
        due: body.data.due,
        priority: body.data.priority,
        columnId: body.data.columnId,
      }),
    });
  }

  if (body.data.action === "move") {
    return NextResponse.json({ task: await moveTask(body.data.id, body.data.columnId) });
  }

  if (body.data.action === "complete") {
    const task = await completeTask(body.data.identifier);
    return NextResponse.json({ task, found: Boolean(task) });
  }

  if (body.data.action === "add_column") {
    return NextResponse.json({ column: await addTaskColumn(body.data.title) });
  }

  if (body.data.action === "rename_column") {
    return NextResponse.json({
      column: await renameTaskColumn(body.data.id, body.data.title),
    });
  }

  if (body.data.action === "delete_column") {
    return NextResponse.json(await deleteTaskColumn(body.data.id));
  }

  if (body.data.action === "reorder_columns") {
    return NextResponse.json({ columns: await reorderTaskColumns(body.data.ids) });
  }

  return NextResponse.json(await clearCompletedTasks());
}
