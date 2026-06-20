import { createLocalId, readJsonFile, writeJsonFile } from "./store";

export type RelayTaskPriority = "low" | "medium" | "high" | "urgent";

export type RelayTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  notes?: string | null;
  due?: string | null;
  priority?: RelayTaskPriority;
  columnId?: string | null;
};

export type TaskColumn = {
  id: string;
  title: string;
  order: number;
  createdAt: string;
};

type AddTaskInput =
  | string
  | {
      title: string;
      notes?: string | null;
      due?: string | null;
      priority?: RelayTaskPriority;
      columnId?: string | null;
    };

const tasksFile = "tasks.json";
const taskColumnsFile = "task-columns.json";

const defaultColumns: TaskColumn[] = [
  {
    id: "today",
    title: "Today",
    order: 0,
    createdAt: "system",
  },
  {
    id: "this-week",
    title: "This Week",
    order: 1,
    createdAt: "system",
  },
  {
    id: "backlog",
    title: "Backlog",
    order: 2,
    createdAt: "system",
  },
];

export async function listTasks() {
  return readJsonFile<RelayTask[]>(tasksFile, []);
}

export async function listTaskColumns() {
  const columns = await readJsonFile<TaskColumn[]>(taskColumnsFile, []);
  return (columns.length > 0 ? columns : defaultColumns).sort(
    (left, right) => left.order - right.order,
  );
}

async function writeTaskColumns(columns: TaskColumn[]) {
  await writeJsonFile(
    taskColumnsFile,
    columns.map((column, index) => ({ ...column, order: index })),
  );
}

export async function addTask(input: AddTaskInput) {
  const tasks = await listTasks();
  const columns = await listTaskColumns();
  const parsed = typeof input === "string" ? { title: input } : input;
  const task: RelayTask = {
    id: createLocalId("task"),
    title: parsed.title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: parsed.notes?.trim() || null,
    due: parsed.due || null,
    priority: parsed.priority ?? "medium",
    columnId: parsed.columnId ?? columns[0]?.id ?? null,
  };

  await writeJsonFile(tasksFile, [task, ...tasks]);
  return task;
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<RelayTask, "title" | "notes" | "due" | "priority" | "columnId">>,
) {
  const tasks = await listTasks();
  let updated: RelayTask | null = null;
  const nextTasks = tasks.map((task) => {
    if (task.id !== id) return task;

    updated = {
      ...task,
      ...patch,
      title: patch.title?.trim() || task.title,
      notes: patch.notes === undefined ? task.notes : patch.notes?.trim() || null,
      due: patch.due === undefined ? task.due : patch.due || null,
      updatedAt: new Date().toISOString(),
    };
    return updated;
  });

  await writeJsonFile(tasksFile, nextTasks);
  return updated;
}

export async function moveTask(id: string, columnId: string) {
  return updateTask(id, { columnId });
}

export async function completeTask(identifier: string): Promise<RelayTask | null> {
  const tasks = await listTasks();
  const indexFromNumber = Number(identifier);
  const targetIndex = Number.isInteger(indexFromNumber)
    ? indexFromNumber - 1
    : -1;
  let completed: RelayTask | null = null;

  const nextTasks = tasks.map((task, index) => {
    const matches =
      task.id === identifier ||
      index === targetIndex ||
      task.title.toLowerCase().includes(identifier.toLowerCase());

    if (!matches) return task;

    completed = {
      ...task,
      completed: true,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return completed;
  });

  await writeJsonFile(tasksFile, nextTasks);
  return completed;
}

export async function clearCompletedTasks() {
  const tasks = await listTasks();
  const openTasks = tasks.filter((task) => !task.completed);
  await writeJsonFile(tasksFile, openTasks);
  return {
    removed: tasks.length - openTasks.length,
    remaining: openTasks.length,
  };
}

export async function addTaskColumn(title: string) {
  const columns = await listTaskColumns();
  const column: TaskColumn = {
    id: createLocalId("column"),
    title: title.trim(),
    order: columns.length,
    createdAt: new Date().toISOString(),
  };

  await writeTaskColumns([...columns, column]);
  return column;
}

export async function renameTaskColumn(id: string, title: string) {
  const columns = await listTaskColumns();
  const nextColumns = columns.map((column) =>
    column.id === id ? { ...column, title: title.trim() || column.title } : column,
  );
  await writeTaskColumns(nextColumns);
  return nextColumns.find((column) => column.id === id) ?? null;
}

export async function deleteTaskColumn(id: string) {
  const columns = await listTaskColumns();
  const remaining = columns.filter((column) => column.id !== id);
  const fallbackId = remaining[0]?.id ?? null;
  const tasks = await listTasks();

  await writeTaskColumns(remaining.length > 0 ? remaining : defaultColumns);
  await writeJsonFile(
    tasksFile,
    tasks.map((task) =>
      task.columnId === id ? { ...task, columnId: fallbackId, updatedAt: new Date().toISOString() } : task,
    ),
  );

  return { remaining: remaining.length, movedTo: fallbackId };
}

export async function reorderTaskColumns(ids: string[]) {
  const columns = await listTaskColumns();
  const ordered = ids
    .map((id) => columns.find((column) => column.id === id))
    .filter((column): column is TaskColumn => Boolean(column));
  const rest = columns.filter((column) => !ids.includes(column.id));
  const nextColumns = [...ordered, ...rest];

  await writeTaskColumns(nextColumns);
  return nextColumns.map((column, index) => ({ ...column, order: index }));
}
