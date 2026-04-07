"use client";

import type {
  Bullet,
  ChecklistItem,
  ContentBlock,
  Page,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  addBlock,
  createChildPage,
  deletePage,
  savePageBlocks,
  updatePageTitle,
  type SaveBlockInput,
} from "@/lib/actions";

export type BlockPayload = ContentBlock & {
  bullets: Bullet[];
  items: ChecklistItem[];
};

function toSaveInput(blocks: BlockPayload[]): SaveBlockInput[] {
  return blocks.map((b) => {
    if (b.type === "CATEGORY") {
      return {
        type: "CATEGORY",
        title: b.title,
        bullets: b.bullets.map((x) => x.text),
      };
    }
    return {
      type: "CHECKLIST",
      title: b.title,
      items: b.items.map((i) => ({
        label: i.label,
        checked: i.checked,
      })),
    };
  });
}

export function PageEditor({
  page,
}: {
  page: Page & { blocks: BlockPayload[] };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [childTitle, setChildTitle] = useState("");
  const [blocks, setBlocks] = useState<BlockPayload[]>(page.blocks);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTitle(page.title);
    setBlocks(page.blocks);
  }, [page.id, page.updatedAt]);

  function save() {
    startTransition(async () => {
      await savePageBlocks(page.id, toSaveInput(blocks));
      router.refresh();
    });
  }

  function onTitleBlur() {
    const t = title.trim();
    if (!t || t === page.title) return;
    startTransition(async () => {
      await updatePageTitle(page.id, t);
      router.refresh();
    });
  }

  function removeBlockAt(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function updateCategory(
    index: number,
    patch: Partial<Pick<ContentBlock, "title">> & { bullets?: string[] },
  ) {
    setBlocks((prev) => {
      const copy = [...prev];
      const b = { ...copy[index] };
      if (patch.title !== undefined) b.title = patch.title;
      if (patch.bullets) {
        b.bullets = patch.bullets.map((text, i) => ({
          ...b.bullets[i],
          id: b.bullets[i]?.id ?? `tmp-${i}`,
          blockId: b.id,
          text,
          sortOrder: i,
        }));
      }
      copy[index] = b;
      return copy;
    });
  }

  function updateChecklist(
    index: number,
    patch: Partial<Pick<ContentBlock, "title">> & {
      items?: { label: string; checked: boolean }[];
    },
  ) {
    setBlocks((prev) => {
      const copy = [...prev];
      const b = { ...copy[index] };
      if (patch.title !== undefined) b.title = patch.title;
      if (patch.items) {
        b.items = patch.items.map((it, i) => ({
          ...b.items[i],
          id: b.items[i]?.id ?? `tmp-${i}`,
          blockId: b.id,
          label: it.label,
          checked: it.checked,
          sortOrder: i,
        }));
      }
      copy[index] = b;
      return copy;
    });
  }

  async function onAddBlock(kind: "CATEGORY" | "CHECKLIST") {
    await addBlock(page.id, kind);
    router.refresh();
  }

  async function onCreateChild(e: React.FormEvent) {
    e.preventDefault();
    const t = childTitle.trim();
    if (!t) return;
    await createChildPage(page.section, page.id, t);
  }

  async function onDeletePage() {
    if (!confirm("Delete this page and all sub-pages?")) return;
    await deletePage(page.id);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xl font-semibold text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={onTitleBlur}
        />
        <button
          type="button"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          onClick={save}
          disabled={pending}
        >
          {pending ? "Saving…" : "Save content"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          className="rounded border border-zinc-600 px-3 py-1.5 hover:bg-zinc-800"
          onClick={() => onAddBlock("CATEGORY")}
        >
          + Category
        </button>
        <button
          type="button"
          className="rounded border border-zinc-600 px-3 py-1.5 hover:bg-zinc-800"
          onClick={() => onAddBlock("CHECKLIST")}
        >
          + Checklist
        </button>
      </div>

      <div className="space-y-6">
        {blocks.map((b, i) => (
          <div
            key={b.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs uppercase text-zinc-500">
                {b.type === "CATEGORY" ? "Category" : "Checklist"}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800"
                  onClick={() => moveBlock(i, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800"
                  onClick={() => moveBlock(i, 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-950"
                  onClick={() => removeBlockAt(i)}
                >
                  Remove
                </button>
              </div>
            </div>
            <input
              className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
              placeholder="Heading (optional)"
              value={b.title ?? ""}
              onChange={(e) =>
                b.type === "CATEGORY"
                  ? updateCategory(i, { title: e.target.value || null })
                  : updateChecklist(i, { title: e.target.value || null })
              }
            />
            {b.type === "CATEGORY" && (
              <textarea
                className="min-h-[120px] w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-2 font-mono text-sm"
                placeholder="One bullet per line"
                value={b.bullets.map((x) => x.text).join("\n")}
                onChange={(e) =>
                  updateCategory(i, {
                    bullets: e.target.value.split("\n"),
                  })
                }
              />
            )}
            {b.type === "CHECKLIST" && (
              <ul className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={item.checked}
                      onChange={(e) => {
                        const items = b.items.map((it, k) =>
                          k === j
                            ? { label: it.label, checked: e.target.checked }
                            : { label: it.label, checked: it.checked },
                        );
                        updateChecklist(i, { items });
                      }}
                    />
                    <input
                      className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
                      value={item.label}
                      onChange={(e) => {
                        const items = b.items.map((it, k) =>
                          k === j
                            ? { label: e.target.value, checked: it.checked }
                            : { label: it.label, checked: it.checked },
                        );
                        updateChecklist(i, { items });
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-red-400"
                      onClick={() =>
                        updateChecklist(i, {
                          items: b.items
                            .filter((_, k) => k !== j)
                            .map((it) => ({
                              label: it.label,
                              checked: it.checked,
                            })),
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="text-sm text-emerald-400 hover:underline"
                    onClick={() =>
                      updateChecklist(i, {
                        items: [
                          ...b.items.map((it) => ({
                            label: it.label,
                            checked: it.checked,
                          })),
                          { label: "New item", checked: false },
                        ],
                      })
                    }
                  >
                    + Add item
                  </button>
                </li>
              </ul>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <h3 className="mb-2 text-sm font-medium text-zinc-300">Sub-page</h3>
        <form onSubmit={onCreateChild} className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            placeholder="New nested page title"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
          />
          <button
            type="submit"
            className="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900"
          >
            Add page under this one
          </button>
        </form>
      </section>

      <div className="border-t border-zinc-800 pt-4">
        <button
          type="button"
          className="text-sm text-red-400 hover:underline"
          onClick={onDeletePage}
        >
          Delete this page…
        </button>
      </div>
    </div>
  );
}
