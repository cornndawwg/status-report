import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SECTION_ORDER, sectionToSlug } from "@/lib/sections";

export default async function HomePage() {
  for (const section of SECTION_ORDER) {
    const root = await prisma.page.findFirst({
      where: { section, parentId: null },
      orderBy: { sortOrder: "asc" },
    });
    if (root) {
      redirect(`/section/${sectionToSlug(section)}/page/${root.id}`);
    }
  }
  return (
    <p className="text-zinc-400">
      No pages yet. Run the database seed and migrate.
    </p>
  );
}
