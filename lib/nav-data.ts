import type { Section } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SECTION_ORDER } from "@/lib/sections";
import { buildTree, type PageNode } from "@/lib/tree";

export async function loadNavTrees(): Promise<Record<Section, PageNode[]>> {
  const trees = {} as Record<Section, PageNode[]>;
  for (const section of SECTION_ORDER) {
    const flat = await prisma.page.findMany({
      where: { section },
      orderBy: { sortOrder: "asc" },
    });
    trees[section] = buildTree(flat);
  }
  return trees;
}
