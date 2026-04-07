import type { Section } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SECTION_ORDER, SECTION_LABEL } from "@/lib/sections";
import {
  buildTree,
  flattenTreeDFS,
  type PageNodeWithBlocks,
} from "@/lib/tree";

export type PdfBlock =
  | { type: "CATEGORY"; title: string | null; bullets: string[] }
  | {
      type: "CHECKLIST";
      title: string | null;
      items: { label: string; checked: boolean }[];
    };

export type PdfPage = { title: string; blocks: PdfBlock[] };

export type PdfSection = { section: Section; label: string; pages: PdfPage[] };

export async function getFullReportForPdf(): Promise<PdfSection[]> {
  const result: PdfSection[] = [];
  for (const section of SECTION_ORDER) {
    const flat = await prisma.page.findMany({
      where: { section },
      orderBy: { sortOrder: "asc" },
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
    const tree = buildTree(flat);
    const ordered: PageNodeWithBlocks[] = flattenTreeDFS(tree);
    const pages: PdfPage[] = ordered.map((p) => ({
      title: p.title,
      blocks: p.blocks.map((b) => {
        if (b.type === "CATEGORY") {
          return {
            type: "CATEGORY" as const,
            title: b.title,
            bullets: b.bullets.map((x) => x.text),
          };
        }
        return {
          type: "CHECKLIST" as const,
          title: b.title,
          items: b.items.map((i) => ({
            label: i.label,
            checked: i.checked,
          })),
        };
      }),
    }));
    result.push({
      section,
      label: SECTION_LABEL[section],
      pages,
    });
  }
  return result;
}
