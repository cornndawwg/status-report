import { HeaderBar } from "@/components/header-bar";
import { Sidebar } from "@/components/sidebar";
import { loadNavTrees } from "@/lib/nav-data";

/** DB-backed layout; must not prerender at build time (no DATABASE_URL in Docker build). */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trees = await loadNavTrees();
  return (
    <div className="flex min-h-screen">
      <Sidebar trees={trees} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col border-l border-slate-200/80 bg-white shadow-sm">
        <HeaderBar />
        <main className="flex-1 px-8 py-8 pb-16">{children}</main>
      </div>
    </div>
  );
}
