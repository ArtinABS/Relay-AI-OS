import { createHash } from "node:crypto";

import { getWorkspaceAccount } from "@/lib/auth/workspace-account";
import { readJsonFile, writeJsonFile } from "@/lib/local-store/store";
import {
  projectRecordSchema,
  type ProjectRecord,
} from "@/lib/projects/model";

function accountProjectFile(accountId: string) {
  const digest = createHash("sha256")
    .update(accountId)
    .digest("hex")
    .slice(0, 24);
  return `projects-${digest}.json`;
}

export async function readAccountProjectRecord() {
  const account = await getWorkspaceAccount();
  if (!account) return { account: null, record: null };

  const stored = await readJsonFile<ProjectRecord | null>(
    accountProjectFile(account.id),
    null,
  );
  const parsed = stored ? projectRecordSchema.safeParse(stored) : null;
  return {
    account,
    record: parsed?.success ? parsed.data : null,
  };
}

export async function writeAccountProjectRecord(record: ProjectRecord) {
  const account = await getWorkspaceAccount();
  if (!account) return { account: null, saved: false };
  const parsed = projectRecordSchema.parse(record);
  await writeJsonFile(accountProjectFile(account.id), parsed);
  return { account, saved: true };
}
