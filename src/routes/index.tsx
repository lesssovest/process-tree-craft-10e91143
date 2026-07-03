import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/process/AppSidebar";
import { ProcessTree } from "@/components/process/ProcessTree";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
          <button
            type="button"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Назад
          </button>

          <header className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight">Структура процессов</h1>
          </header>

          <ProcessTree />
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
