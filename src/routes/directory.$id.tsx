import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { StructureEditor } from "@/components/process/StructureEditor";
import { getDirectory } from "@/lib/directories";

function NotFound() {
  return (
    <AppLayout active="knowledge">
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">Справочник не найден</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Вернуться в Базу знаний
        </Link>
      </div>
    </AppLayout>
  );
}

function ErrorState({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <AppLayout active="knowledge">
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">Не удалось открыть справочник</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Повторить
        </button>
      </div>
    </AppLayout>
  );
}

export const Route = createFileRoute("/directory/$id")({
  loader: ({ params }) => {
    const directory = getDirectory(params.id);
    if (!directory) throw notFound();
    return {
      id: directory.id,
      title: directory.title,
      description: directory.description,
      linear: directory.linear,
      addLabel: directory.addLabel,
      searchPlaceholder: directory.searchPlaceholder,
      itemPlaceholder: directory.itemPlaceholder,
      countNoun: directory.countNoun,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Справочники` : "Справочник" },
      { name: "description", content: loaderData?.description ?? "Редактор справочника" },
    ],
  }),
  component: DirectoryPage,
  notFoundComponent: NotFound,
  errorComponent: ErrorState,
});

function DirectoryPage() {
  const cfg = Route.useLoaderData();
  const dir = getDirectory(cfg.id)!;

  return (
    <AppLayout active="knowledge">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          База знаний
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Справочники</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{cfg.title}</span>
      </nav>

      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Назад
      </Link>

      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">{cfg.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{cfg.description}</p>
      </header>

      <StructureEditor
        key={dir.id}
        seed={dir.seed}
        linear={dir.linear}
        addLabel={dir.addLabel}
        searchPlaceholder={dir.searchPlaceholder}
        itemPlaceholder={dir.itemPlaceholder}
        countNoun={dir.countNoun}
      />
    </AppLayout>
  );
}