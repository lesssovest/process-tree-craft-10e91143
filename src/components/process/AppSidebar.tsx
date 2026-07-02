import {
  Home,
  Zap,
  AlertTriangle,
  Shield,
  BarChart3,
  Cpu,
  Target,
  BookOpen,
  ChevronRight,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Главная", icon: Home },
  { label: "События", icon: Zap },
  { label: "Риски", icon: AlertTriangle },
  { label: "Меры", icon: Shield },
  { label: "Аналитика", icon: BarChart3 },
  { label: "AI мониторинг", icon: Cpu },
  { label: "Структура процессов", icon: Boxes, active: true },
  { label: "Лимитная кампания", icon: Target },
  { label: "База знаний", icon: BookOpen },
];

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Boxes className="size-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-sidebar-foreground">НОРМ</span>
      </div>

      <button
        type="button"
        className="mt-6 flex items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-sidebar-accent"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-card text-muted-foreground">
          <Boxes className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">Организация</p>
          <p className="truncate text-sm font-medium text-sidebar-foreground">ООО СК Пётр и уче…</p>
          <span className="mt-0.5 inline-block rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            Тариф Профессиональный
          </span>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <nav className="mt-6 flex flex-col gap-1">
        {nav.map((item) => (
          <a
            key={item.label}
            href="#"
            onClick={(e) => e.preventDefault()}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <item.icon className="size-[18px] shrink-0" />
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}