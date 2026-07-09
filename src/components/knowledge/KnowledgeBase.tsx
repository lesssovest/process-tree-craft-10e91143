import { Link } from "@tanstack/react-router";
import {
  Activity,
  ClipboardCheck,
  Users,
  Wallet,
  Search,
  Package,
  FolderTree,
  Plus,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { directories } from "@/lib/directories";

interface StaticCard {
  title: string;
  icon: typeof Activity;
  count: number;
  subtitle?: string;
  tags?: string[];
  iconClass: string;
}

const staticCards: StaticCard[] = [
  {
    title: "Индикатор зрелости",
    icon: Activity,
    count: 2,
    subtitle: "Данные об управлении операционными рисками в ДЗО",
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Стандарты",
    icon: ClipboardCheck,
    count: 0,
    tags: ["Политики", "Методики", "Регламенты", "Рекомендации"],
    iconClass: "bg-sky-100 text-sky-600",
  },
  {
    title: "Структура компании",
    icon: Users,
    count: 0,
    tags: ["Устав", "Оргструктура", "Штатное расписание"],
    iconClass: "bg-violet-100 text-violet-600",
  },
  {
    title: "Финансовое состояние",
    icon: Wallet,
    count: 0,
    tags: ["Бухгалтерский баланс", "ОПУ", "Пояснительная записка"],
    iconClass: "bg-amber-100 text-amber-600",
  },
  {
    title: "Аудиты и проверки",
    icon: Search,
    count: 0,
    tags: ["Внутренние и внешние аудиты", "Акты проверок"],
    iconClass: "bg-rose-100 text-rose-600",
  },
  {
    title: "Прочее",
    icon: Package,
    count: 0,
    iconClass: "bg-slate-100 text-slate-600",
  },
];

export function KnowledgeBase() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">— База знаний Норма AI</h1>
      </header>

      {/* Banner */}
      <div className="mb-8 flex items-start gap-5 rounded-2xl border border-border bg-accent/40 p-5 sm:p-6">
        <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary sm:flex">
          <Sparkles className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Хочешь научить меня чему-то новому?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Поделись со мной документами. Я изучу их и помогу тебе ответить на вопросы или выявить
            риски для компании.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Обучить Норма
            </button>
            <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent">
              Какие документы нужны?
            </button>
          </div>
        </div>
      </div>

      {/* Tabs (visual) */}
      <div className="mb-5 inline-flex rounded-xl border border-border bg-card p-1">
        <span className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          Документы компании
        </span>
        <span className="px-4 py-1.5 text-sm font-medium text-muted-foreground">
          Документы Банка
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Справочники — folder card */}
        <Link
          to="/directories"
          className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
        >
          <div className="mb-3 flex items-start">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FolderTree className="size-5" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">
            Справочники <span className="text-muted-foreground">{directories.length}</span>
          </p>
        </Link>

        {staticCards.map((card) => (
          <div
            key={card.title}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className={cn("flex size-10 items-center justify-center rounded-xl", card.iconClass)}>
                <card.icon className="size-5" />
              </div>
              <span className="flex size-7 items-center justify-center rounded-lg text-muted-foreground">
                <Plus className="size-4" />
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {card.title} <span className="text-muted-foreground">{card.count}</span>
            </p>
            {card.subtitle && (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            )}
            {card.tags && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}