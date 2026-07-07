import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { KnowledgeBase } from "@/components/knowledge/KnowledgeBase";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppLayout active="knowledge">
      <KnowledgeBase />
    </AppLayout>
  );
}
