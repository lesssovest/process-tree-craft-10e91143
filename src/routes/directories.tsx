import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { directories } from "@/lib/directories";

export const Route = createFileRoute("/directories")({
  head: () => ({
    meta: [
      { title: "Справочники — База знаний" },
      {
        name: "description",
        content: "Справочники структур: орг. структура, процессы и ИТ-системы",
      },
    ],
  }),
  component: DirectoriesPage,
});

function DirectoriesPage() {
  return (
    <AppLayout active="knowledge">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          База знаний
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Справочники</span>
      </nav>

      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Назад
      </Link>

      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Справочники</h1>
      </header>

      <ul className="flex flex-col gap-2.5">
        {directories.map((d) => (
          <li key={d.id}>
            <Link
              to="/directory/$id"
              params={{ id: d.id }}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <d.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-foreground">
                  {d.title}
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                  {d.description}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </AppLayout>
  );
}
