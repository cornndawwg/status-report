import { HeaderBar } from "@/components/header-bar";
import { Sidebar } from "@/components/sidebar";
import { loadNavTrees } from "@/lib/nav-data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trees = await loadNavTrees();
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar trees={trees} />
      <div className="flex min-h-screen flex-1 flex-col pt-14 md:pt-0">
        <HeaderBar />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
