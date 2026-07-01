import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/states/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { getRouteMeta } from "@/lib/route-meta";
import { FolderKanban } from "lucide-react";

const meta = getRouteMeta("/workspaces")!;

export const Route = createFileRoute("/_app/workspaces")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="Workspace" title={meta.label} description={meta.description} />
      <EmptyState
        icon={FolderKanban}
        title="No additional workspaces"
        description="Workspaces let you isolate teams, regions, or business units with their own data and permissions."
      />
    </>
  ),
});
