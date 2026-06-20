import { createLocalId, readJsonFile, writeJsonFile } from "./store";

const scheduledEmailsFile = "scheduled-emails.json";

export type ScheduledEmail = {
  id: string;
  createdAt: string;
  draftId: string | null;
  sendAt: string;
  status: "scheduled" | "sent" | "cancelled";
  email: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    threadId?: string | null;
  };
};

export async function listScheduledEmails() {
  return readJsonFile<ScheduledEmail[]>(scheduledEmailsFile, []);
}

export async function addScheduledEmail(
  input: Omit<ScheduledEmail, "id" | "createdAt" | "status">,
) {
  const scheduled = await listScheduledEmails();
  const next: ScheduledEmail = {
    ...input,
    id: createLocalId("scheduled_email"),
    createdAt: new Date().toISOString(),
    status: "scheduled",
  };

  await writeJsonFile(scheduledEmailsFile, [next, ...scheduled]);
  return next;
}
