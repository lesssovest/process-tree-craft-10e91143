import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/process/AppSidebar";

export function AppLayout({
  children,
  active,
}: {
  children: ReactNode;
  active?: string;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar active={active} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}