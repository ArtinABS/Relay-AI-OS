"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { WorkspaceCopilotActions } from "./workspace-copilot-actions";

export function AppCopilotProvider({ children }: { children: ReactNode }) {
  const enableCopilotKit =
    process.env.NEXT_PUBLIC_ENABLE_COPILOTKIT === "true";

  if (!enableCopilotKit) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <CopilotKit
        runtimeUrl="/api/copilotkit"
        agent="default"
        showDevConsole={process.env.NODE_ENV === "development"}
        enableInspector={process.env.NODE_ENV === "development"}
      >
        <WorkspaceCopilotActions />
        {children}
      </CopilotKit>
    </SessionProvider>
  );
}
