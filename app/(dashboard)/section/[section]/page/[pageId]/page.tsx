import { notFound } from "next/navigation";
import { PageEditor } from "@/components/page-editor";
import { prisma } from "@/lib/prisma";
import { slugToSection } from "@/lib/sections";

export default async function EditPage({
  params,
}: {
  params: Promise<{ section: string; pageId: string }>;
}) {
  const { section: sectionSlug, pageId } = await params;
  const section = slugToSection(sectionSlug);
  if (!section) notFound();

  const page = await prisma.page.findFirst({
    where: { id: pageId, section },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
        include: {
          bullets: { orderBy: { sortOrder: "asc" } },
          items: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!page) notFound();

  return <PageEditor page={page} />;
}
