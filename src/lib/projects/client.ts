"use client";

import {
  defaultProjectLayout,
  projectLayoutStorageKey,
  projectRecordSchema,
  projectRecordUpdatedEvent,
  projectStorageKey,
  type ProjectRecord,
} from "@/lib/projects/model";

export function readBrowserProjectRecord(): ProjectRecord | undefined {
  try {
    const storedProject = window.localStorage.getItem(projectStorageKey);
    if (!storedProject) return undefined;
    const storedLayout = window.localStorage.getItem(projectLayoutStorageKey);
    const parsed = projectRecordSchema.safeParse({
      layout: storedLayout ? JSON.parse(storedLayout) : defaultProjectLayout,
      store: JSON.parse(storedProject),
      version: 1,
    });
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function applyBrowserProjectRecord(record: ProjectRecord) {
  const parsed = projectRecordSchema.parse(record);
  window.localStorage.setItem(
    projectStorageKey,
    JSON.stringify(parsed.store),
  );
  window.localStorage.setItem(
    projectLayoutStorageKey,
    JSON.stringify(parsed.layout),
  );
  window.dispatchEvent(
    new CustomEvent<ProjectRecord>(projectRecordUpdatedEvent, {
      detail: parsed,
    }),
  );
}
