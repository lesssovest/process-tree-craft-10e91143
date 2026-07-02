import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Trash2,
  Check,
  X,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  MAX_DEPTH,
  type DropPosition,
  type ProcessNode,
  collectAllIds,
  countNodes,
  demoteNode,
  depthOf,
  findNode,
  getMeta,
  hasDuplicateSibling,
  heightOf,
  insertRelative,
  isDescendant,
  makeNode,
  moveNode,
  promoteNode,
  removeFromTree,
  searchMatches,
  seedProcesses,
  updateTree,
} from "@/lib/process-tree";

interface DragState {
  dragId: string;
  overId: string | null;
  position: DropPosition | null;
}

interface RowHandlers {
  expanded: Set<string>;
  editingId: string | null;
  matched: Set<string>;
  searching: boolean;
  drag: DragState | null;
  toggleExpand: (id: string) => void;
  startEdit: (id: string) => void;
  commitEdit: (id: string, name: string) => void;
  cancelEdit: () => void;
  addChild: (id: string) => void;
  toggleActive: (id: string) => void;
  moveVert: (id: string, dir: -1 | 1) => void;
  promote: (id: string) => void;
  demote: (id: string) => void;
  requestDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string, e: React.DragEvent, hasChildren: boolean) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  nodes: ProcessNode[];
}

export function ProcessTree() {
  const [nodes, setNodes] = useState<ProcessNode[]>(seedProcesses);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(seedProcesses));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectAllIds(seedProcesses)));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const newlyAddedId = useRef<string | null>(null);

  const dirty = JSON.stringify(nodes) !== savedSnapshot;

  const { matched, searchExpand } = useMemo(() => {
    if (!query.trim()) return { matched: new Set<string>(), searchExpand: new Set<string>() };
    const res = searchMatches(nodes, query);
    return { matched: res.matched, searchExpand: res.expand };
  }, [nodes, query]);

  const searching = query.trim().length > 0;
  const effectiveExpanded = searching ? searchExpand : expanded;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(collectAllIds(nodes)));
  const collapseAll = () => setExpanded(new Set());

  const startEdit = (id: string) => setEditingId(id);
  const cancelEdit = () => {
    // discard an empty freshly-added node
    if (newlyAddedId.current === editingId && editingId) {
      const node = findNode(nodes, editingId);
      if (node && !node.name.trim()) {
        setNodes((prev) => removeFromTree(prev, editingId).tree);
      }
    }
    newlyAddedId.current = null;
    setEditingId(null);
  };

  const commitEdit = (id: string, rawName: string) => {
    const name = rawName.trim();
    if (!name) {
      toast.error("Название не может быть пустым");
      return;
    }
    const meta = getMeta(nodes, id);
    const siblings = meta?.parentId ? findNode(nodes, meta.parentId)?.children ?? [] : nodes;
    if (hasDuplicateSibling(siblings, name, id)) {
      toast.error("Элемент с таким названием уже есть на этом уровне");
      return;
    }
    setNodes((prev) => updateTree(prev, id, (n) => ({ ...n, name })));
    newlyAddedId.current = null;
    setEditingId(null);
  };

  const addRoot = () => {
    const node = makeNode("");
    newlyAddedId.current = node.id;
    setNodes((prev) => [...prev, node]);
    setEditingId(node.id);
  };

  const addChild = (parentId: string) => {
    const depth = depthOf(nodes, parentId); // 0-based
    if (depth + 2 > MAX_DEPTH) {
      toast.error(`Достигнута максимальная глубина вложенности (${MAX_DEPTH} уровней)`);
      return;
    }
    const node = makeNode("");
    newlyAddedId.current = node.id;
    setNodes((prev) => updateTree(prev, parentId, (n) => ({ ...n, children: [...n.children, node] })));
    setExpanded((prev) => new Set(prev).add(parentId));
    setEditingId(node.id);
  };

  const toggleActive = (id: string) => {
    setNodes((prev) => updateTree(prev, id, (n) => ({ ...n, active: !n.active })));
  };

  const moveVert = (id: string, dir: -1 | 1) => setNodes((prev) => moveNode(prev, id, dir));

  const promote = (id: string) => {
    const meta = getMeta(nodes, id);
    if (!meta || meta.parentId === null) {
      toast.info("Элемент уже на корневом уровне");
      return;
    }
    setNodes((prev) => promoteNode(prev, id));
  };

  const demote = (id: string) => {
    const meta = getMeta(nodes, id);
    if (!meta || meta.prevSiblingId === null) {
      toast.info("Нет элемента, в который можно вложить");
      return;
    }
    const target = findNode(nodes, meta.prevSiblingId)!;
    const node = findNode(nodes, id)!;
    if (depthOf(nodes, target.id) + 1 + heightOf(node) > MAX_DEPTH) {
      toast.error(`Достигнута максимальная глубина вложенности (${MAX_DEPTH} уровней)`);
      return;
    }
    if (hasDuplicateSibling(target.children, node.name)) {
      toast.error("Элемент с таким названием уже есть на этом уровне");
      return;
    }
    setNodes((prev) => demoteNode(prev, id));
    setExpanded((prev) => new Set(prev).add(meta.prevSiblingId!));
  };

  const requestDelete = (id: string) => {
    const node = findNode(nodes, id);
    if (node && node.children.length === 0) {
      setNodes((prev) => removeFromTree(prev, id).tree);
      toast.success("Элемент удалён");
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setNodes((prev) => removeFromTree(prev, deleteId).tree);
    setDeleteId(null);
    toast.success("Элемент удалён вместе с подпроцессами");
  };

  // ---- Drag & drop ----
  const onDragStart = (id: string) => setDrag({ dragId: id, overId: null, position: null });

  const onDragOver = (id: string, e: React.DragEvent, hasChildren: boolean) => {
    e.preventDefault();
    if (!drag || drag.dragId === id) return;
    const dragged = findNode(nodes, drag.dragId);
    if (dragged && isDescendant(dragged, id)) return; // can't drop into own subtree
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = y / rect.height;
    let position: DropPosition;
    if (ratio < 0.28) position = "before";
    else if (ratio > 0.72) position = "after";
    else position = "inside";
    setDrag((prev) => (prev ? { ...prev, overId: id, position } : prev));
  };

  const onDrop = (targetId: string) => {
    if (!drag || !drag.position || drag.dragId === targetId) return void setDrag(null);
    const { dragId, position } = drag;
    const dragged = findNode(nodes, dragId);
    const target = findNode(nodes, targetId);
    if (!dragged || !target || isDescendant(dragged, targetId)) return void setDrag(null);

    // depth check
    const targetDepth = depthOf(nodes, targetId); // 0-based
    const baseDepth = position === "inside" ? targetDepth + 1 : targetDepth;
    if (baseDepth + heightOf(dragged) > MAX_DEPTH) {
      toast.error(`Достигнута максимальная глубина вложенности (${MAX_DEPTH} уровней)`);
      return void setDrag(null);
    }

    // duplicate check within destination parent
    const destSiblings =
      position === "inside"
        ? target.children
        : (getMeta(nodes, targetId)?.parentId
            ? findNode(nodes, getMeta(nodes, targetId)!.parentId!)?.children
            : nodes) ?? [];
    if (hasDuplicateSibling(destSiblings, dragged.name, dragId)) {
      toast.error("Элемент с таким названием уже есть на этом уровне");
      return void setDrag(null);
    }

    setNodes((prev) => {
      const { tree, removed } = removeFromTree(prev, dragId);
      if (!removed) return prev;
      return insertRelative(tree, targetId, removed, position);
    });
    if (position === "inside") setExpanded((prev) => new Set(prev).add(targetId));
    setDrag(null);
  };

  const onDragEnd = () => setDrag(null);

  const save = () => {
    setSavedSnapshot(JSON.stringify(nodes));
    toast.success("Изменения сохранены", {
      description: `${countNodes(nodes)} процессов в структуре`,
    });
  };

  const handlers: RowHandlers = {
    expanded: effectiveExpanded,
    editingId,
    matched,
    searching,
    drag,
    toggleExpand,
    startEdit,
    commitEdit,
    cancelEdit,
    addChild,
    toggleActive,
    moveVert,
    promote,
    demote,
    requestDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    nodes,
  };

  const deleteNode = deleteId ? findNode(nodes, deleteId) : null;
  const deleteChildCount = deleteNode ? countNodes(deleteNode.children) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={addRoot} className="gap-2">
          <Plus className="size-4" /> Добавить корневой процесс
        </Button>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Развернуть всё
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Свернуть всё
          </Button>
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию процесса..."
            className="bg-card"
          />
        </div>
        <Button onClick={save} disabled={!dirty} variant={dirty ? "default" : "outline"} className="gap-2">
          <Check className="size-4" /> Сохранить изменения
          {dirty && <span className="ml-1 inline-block size-2 rounded-full bg-primary-foreground/80" />}
        </Button>
      </div>

      {/* Tree card */}
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">Структура процессов пуста</p>
            <Button variant="outline" size="sm" onClick={addRoot} className="gap-2">
              <Plus className="size-4" /> Добавить первый процесс
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col">
            {nodes.map((n) => (
              <TreeRow key={n.id} node={n} depth={0} h={handlers} />
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Всего процессов: {countNodes(nodes)} · Максимальная глубина: {MAX_DEPTH} уровней. Перетащите
        элемент, чтобы изменить порядок или уровень вложенности.
      </p>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить процесс?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteChildCount > 0 ? (
                <>
                  «{deleteNode?.name}» содержит {deleteChildCount} вложенны{deleteChildCount === 1 ? "й элемент" : "х элементов"}.
                  Удалить вместе с подпроцессами? Действие нельзя отменить.
                </>
              ) : (
                <>Удалить «{deleteNode?.name}»? Действие нельзя отменить.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TreeRow({ node, depth, h }: { node: ProcessNode; depth: number; h: RowHandlers }) {
  const hasChildren = node.children.length > 0;
  const isOpen = h.expanded.has(node.id);
  const isEditing = h.editingId === node.id;
  const isMatch = h.searching && h.matched.has(node.id);
  const isDragging = h.drag?.dragId === node.id;
  const isOver = h.drag?.overId === node.id;
  const dropPos = isOver ? h.drag?.position : null;

  return (
    <li>
      <div
        draggable={!isEditing}
        onDragStart={(e) => {
          e.stopPropagation();
          h.onDragStart(node.id);
        }}
        onDragOver={(e) => h.onDragOver(node.id, e, hasChildren)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          h.onDrop(node.id);
        }}
        onDragEnd={h.onDragEnd}
        className={cn(
          "group relative flex items-center gap-1 rounded-lg py-1.5 pr-2 transition-colors",
          "hover:bg-accent/50",
          isDragging && "opacity-40",
          dropPos === "inside" && "bg-accent ring-1 ring-primary/40",
        )}
        style={{ paddingLeft: depth * 22 + 4 }}
      >
        {dropPos === "before" && (
          <span className="absolute left-2 right-2 top-0 h-0.5 rounded-full bg-primary" />
        )}
        {dropPos === "after" && (
          <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-primary" />
        )}

        {/* connector / indent guides */}
        {depth > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 border-l border-border/70"
            style={{ left: depth * 22 - 9 }}
          />
        )}

        <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/40 opacity-0 group-hover:opacity-100" />

        {/* expander */}
        <button
          type="button"
          onClick={() => hasChildren && h.toggleExpand(node.id)}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground",
            hasChildren ? "hover:bg-accent hover:text-foreground" : "invisible",
          )}
        >
          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        {/* name / inline editor */}
        {isEditing ? (
          <InlineEditor
            initial={node.name}
            onCommit={(v) => h.commitEdit(node.id, v)}
            onCancel={h.cancelEdit}
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => h.startEdit(node.id)}
            className={cn(
              "flex-1 truncate text-left text-sm",
              node.active ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/40",
              isMatch && "rounded bg-primary/15 px-1 font-medium",
            )}
            title={node.name}
          >
            {node.name || <span className="italic text-muted-foreground">Без названия</span>}
          </button>
        )}

        {!node.active && !isEditing && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Неактивен
          </span>
        )}

        {/* actions */}
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <IconBtn title="Редактировать название" onClick={() => h.startEdit(node.id)}>
              <Pencil className="size-3.5" />
            </IconBtn>
            <IconBtn title="Добавить дочерний" onClick={() => h.addChild(node.id)}>
              <Plus className="size-3.5" />
            </IconBtn>
            <IconBtn title="Переместить вверх" onClick={() => h.moveVert(node.id, -1)}>
              <ArrowUp className="size-3.5" />
            </IconBtn>
            <IconBtn title="Переместить вниз" onClick={() => h.moveVert(node.id, 1)}>
              <ArrowDown className="size-3.5" />
            </IconBtn>
            <IconBtn title="Повысить уровень" onClick={() => h.promote(node.id)}>
              <ChevronLeft className="size-3.5" />
            </IconBtn>
            <IconBtn title="Понизить уровень" onClick={() => h.demote(node.id)}>
              <ChevronRight className="size-3.5" />
            </IconBtn>
            <IconBtn
              title={node.active ? "Деактивировать" : "Активировать"}
              onClick={() => h.toggleActive(node.id)}
            >
              {node.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </IconBtn>
            <IconBtn title="Удалить" danger onClick={() => h.requestDelete(node.id)}>
              <Trash2 className="size-3.5" />
            </IconBtn>
          </div>
        )}
      </div>

      {hasChildren && isOpen && (
        <ul className="flex flex-col">
          {node.children.map((c) => (
            <TreeRow key={c.id} node={c} depth={depth + 1} h={h} />
          ))}
        </ul>
      )}
    </li>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function InlineEditor({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex flex-1 items-center gap-1">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit(value);
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => onCommit(value)}
        placeholder="Название процесса"
        className="h-8 flex-1"
      />
      <button
        type="button"
        title="Сохранить"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommit(value)}
        className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Check className="size-3.5" />
      </button>
      <button
        type="button"
        title="Отмена"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}