"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Section } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sectionToSlug } from "@/lib/sections";

function pagePath(section: Section, pageId: string) {
  return `/section/${sectionToSlug(section)}/page/${pageId}`;
}

export async function createChildPage(
  section: Section,
  parentId: string | null,
  title: string,
) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title required");
  const base = slugify(trimmed) || "page";
  const slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  const siblings = await prisma.page.count({ where: { section, parentId } });
  const page = await prisma.page.create({
    data: {
      section,
      parentId,
      title: trimmed,
      slug,
      sortOrder: siblings,
    },
  });
  revalidatePath("/");
  revalidatePath(`/section/${sectionToSlug(section)}`, "layout");
  redirect(pagePath(section, page.id));
}

export async function updatePageTitle(
  pageId: string,
  title: string,
  options?: { revalidate?: boolean },
) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title required");
  const page = await prisma.page.update({
    where: { id: pageId },
    data: { title: trimmed },
  });
  if (options?.revalidate === false) return;
  revalidatePath("/");
  revalidatePath(`/section/${sectionToSlug(page.section)}`, "layout");
  revalidatePath(pagePath(page.section, pageId));
}

export async function deletePage(pageId: string) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) return;
  const section = page.section;
  const parentId = page.parentId;
  await prisma.page.delete({ where: { id: pageId } });
  revalidatePath("/");
  revalidatePath(`/section/${sectionToSlug(section)}`, "layout");
  if (parentId) {
    redirect(pagePath(section, parentId));
  }
  const root = await prisma.page.findFirst({
    where: { section, parentId: null },
    orderBy: { sortOrder: "asc" },
  });
  if (root) redirect(pagePath(section, root.id));
  redirect("/");
}

export type SaveBlockInput =
  | { type: "CATEGORY"; title: string | null; bullets: string[] }
  | {
      type: "CHECKLIST";
      title: string | null;
      items: { label: string; checked: boolean }[];
    };

export async function savePageBlocks(
  pageId: string,
  blocks: SaveBlockInput[],
  options?: { revalidate?: boolean },
) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page not found");

  await prisma.$transaction(async (tx) => {
    await tx.contentBlock.deleteMany({ where: { pageId } });
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === "CATEGORY") {
        const block = await tx.contentBlock.create({
          data: {
            pageId,
            type: "CATEGORY",
            title: b.title,
            sortOrder: i,
          },
        });
        const lines = b.bullets.map((t) => t.trim()).filter(Boolean);
        for (let j = 0; j < lines.length; j++) {
          await tx.bullet.create({
            data: { blockId: block.id, text: lines[j], sortOrder: j },
          });
        }
      } else {
        const block = await tx.contentBlock.create({
          data: {
            pageId,
            type: "CHECKLIST",
            title: b.title,
            sortOrder: i,
          },
        });
        for (let j = 0; j < b.items.length; j++) {
          const it = b.items[j];
          await tx.checklistItem.create({
            data: {
              blockId: block.id,
              label: it.label,
              checked: it.checked,
              sortOrder: j,
            },
          });
        }
      }
    }
  });

  if (options?.revalidate !== false) {
    revalidatePath(pagePath(page.section, pageId));
  }
}

export async function addBlock(pageId: string, kind: "CATEGORY" | "CHECKLIST") {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { blocks: true },
  });
  if (!page) throw new Error("Page not found");
  const nextOrder = page.blocks.length;
  if (kind === "CATEGORY") {
    await prisma.contentBlock.create({
      data: {
        pageId,
        type: "CATEGORY",
        title: "New category",
        sortOrder: nextOrder,
        bullets: { create: [{ text: "", sortOrder: 0 }] },
      },
    });
  } else {
    await prisma.contentBlock.create({
      data: {
        pageId,
        type: "CHECKLIST",
        title: "Checklist",
        sortOrder: nextOrder,
        items: {
          create: [{ label: "Item", checked: false, sortOrder: 0 }],
        },
      },
    });
  }
  revalidatePath(pagePath(page.section, pageId));
}
