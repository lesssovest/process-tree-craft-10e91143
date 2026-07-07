import type { LucideIcon } from "lucide-react";
import { Boxes, Building2, Server } from "lucide-react";

import {
  type ProcessNode,
  seedItSystems,
  seedOrgStructure,
  seedProcesses,
} from "@/lib/process-tree";

export interface DirectoryConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Linear list (no tree, no drag-and-drop, no child creation). */
  linear: boolean;
  seed: ProcessNode[];
  addLabel: string;
  searchPlaceholder: string;
  itemPlaceholder: string;
  /** Noun used in counts, e.g. "процессов", "элементов", "систем". */
  countNoun: string;
}

export const directories: DirectoryConfig[] = [
  {
    id: "org",
    title: "Орг. структура",
    description: "Иерархия подразделений и служб организации",
    icon: Building2,
    linear: false,
    seed: seedOrgStructure,
    addLabel: "Добавить подразделение",
    searchPlaceholder: "Поиск по названию подразделения...",
    itemPlaceholder: "Название подразделения",
    countNoun: "подразделений",
  },
  {
    id: "processes",
    title: "Процессы",
    description: "Иерархическая структура бизнес-процессов",
    icon: Boxes,
    linear: false,
    seed: seedProcesses,
    addLabel: "Добавить корневой процесс",
    searchPlaceholder: "Поиск по названию процесса...",
    itemPlaceholder: "Название процесса",
    countNoun: "процессов",
  },
  {
    id: "it-systems",
    title: "ИТ-системы",
    description: "Линейный список информационных систем",
    icon: Server,
    linear: true,
    seed: seedItSystems,
    addLabel: "Добавить ИТ-систему",
    searchPlaceholder: "Поиск по названию системы...",
    itemPlaceholder: "Название ИТ-системы",
    countNoun: "систем",
  },
];

export function getDirectory(id: string): DirectoryConfig | undefined {
  return directories.find((d) => d.id === id);
}