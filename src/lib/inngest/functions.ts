import { inngest } from "./client";

export const dailyPlanningJob = inngest.createFunction(
  {
    id: "daily-planning-snapshot",
    triggers: [{ cron: "TZ=Asia/Tehran 0 8 * * *" }],
  },
  async ({ step }) => {
    const snapshot = await step.run("prepare-snapshot", async () => ({
      createdAt: new Date().toISOString(),
      status: "ready-for-agent-planning",
    }));

    return snapshot;
  },
);
