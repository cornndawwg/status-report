"use client";

import type {
  BlockColumn,
  Bullet,
  ChecklistItem,
  ContentBlock,
  Page,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
  columns: BlockColumn[];
};

function sortedColumns(b: BlockPayload): BlockColumn[] {
  if (b.type !== "COLUMNS") return [];
  return [...b.columns].sort((a, c) => a.columnIndex - c.columnIndex);
}

function toSaveInput(blocks: BlockPayload[]): SaveBlockInput[] {
  return blocks.map((b) => {
    if (b.type === "CATEGORY") {
      return {
        type: "CATEGORY",
        title: b.title,
        bullets: b.bullets.map((x) => x.text),
      };
    }
    if (b.type === "CHECKLIST") {
      return {
        type: "CHECKLIST",
        title: b.title,
        items: b.items.map((i) => ({
          label: i.label,
          checked: i.checked,
        })),
      };
    }
    return {
      type: "COLUMNS",
      title: b.title,
      columns: sortedColumns(b).map((c) => ({
        heading: c.heading,
        lines: c.body.split("\n"),
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
  const [dirty, setDirty] = useState(false);
  const [saveHint, setSaveHint] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveHintClear = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(page.title);
    setBlocks(
      page.blocks.map((b) => ({
        ...b,
        bullets: b.bullets ?? [],
        items: b.items ?? [],
        columns: b.columns ?? [],
      })),
    );
    setDirty(false);
    setSaveHint("idle");
  }, [page.id, page.updatedAt]);

  /** Persist blocks + title. Use `revalidate: false` for background saves so the page doesn’t refresh while you type. */
  async function persistDraft(opts?: { revalidate?: boolean }): Promise<void> {
    const r = opts?.revalidate ?? true;
    await savePageBlocks(page.id, toSaveInput(blocks), { revalidate: r });
    const t = title.trim();
    if (t && t !== page.title) {
      await updatePageTitle(page.id, t, { revalidate: r });
    }
  }

  /** Autosave a few seconds after you stop editing */
  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(() => {
      startTransition(async () => {
        setSaveHint("saving");
        try {
          await persistDraft({ revalidate: false });
          setSaveHint("saved");
          setDirty(false);
          if (saveHintClear.current) clearTimeout(saveHintClear.current);
          saveHintClear.current = setTimeout(() => setSaveHint("idle"), 2500);
        } catch {
          setSaveHint("idle");
        }
      });
    }, 2200);
    return () => clearTimeout(id);
  }, [dirty, blocks, title, page.id, page.title]);

  function save() {
    startTransition(async () => {
      setSaveHint("saving");
      await persistDraft();
      setSaveHint("saved");
      setDirty(false);
      router.refresh();
      if (saveHintClear.current) clearTimeout(saveHintClear.current);
      saveHintClear.current = setTimeout(() => setSaveHint("idle"), 2500);
    });
  }

  function markDirty() {
    setDirty(true);
  }

  function onTitleChange(v: string) {
    setTitle(v);
    markDirty();
  }

  function removeBlockAt(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  }

  function moveBlock(index: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
    markDirty();
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
    markDirty();
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
    markDirty();
  }

  function updateColumnsBlock(
    index: number,
    patch: Partial<Pick<ContentBlock, "title">>,
  ) {
    setBlocks((prev) => {
      const copy = [...prev];
      const b = { ...copy[index] };
      if (patch.title !== undefined) b.title = patch.title;
      copy[index] = b;
      return copy;
    });
    markDirty();
  }

  function updateColumnField(
    blockIndex: number,
    colIdx: number,
    field: "heading" | "body",
    value: string,
  ) {
    setBlocks((prev) => {
      const copy = [...prev];
      const b = copy[blockIndex];
      if (b.type !== "COLUMNS") return prev;
      const cols = sortedColumns(b).map((c) => ({ ...c }));
      const col = { ...cols[colIdx] };
      if (field === "heading") col.heading = value.trim() ? value : null;
      else col.body = value;
      cols[colIdx] = col;
      copy[blockIndex] = {
        ...b,
        columns: cols.map((c, idx) => ({ ...c, columnIndex: idx })),
      };
      return copy;
    });
    markDirty();
  }

  function setColumnCount(blockIndex: number, count: 2 | 3) {
    setBlocks((prev) => {
      const copy = [...prev];
      const b = copy[blockIndex];
      if (b.type !== "COLUMNS") return prev;
      let cols = sortedColumns(b).map((c) => ({ ...c }));
      if (count === 2 && cols.length > 2) cols = cols.slice(0, 2);
      if (count === 3 && cols.length === 2) {
        cols.push({
          id: `tmp-col-${Date.now()}`,
          blockId: b.id,
          columnIndex: 2,
          heading: null,
          body: "",
        });
      }
      copy[blockIndex] = {
        ...b,
        columns: cols.map((c, idx) => ({ ...c, columnIndex: idx })),
      };
      return copy;
    });
    markDirty();
  }

  function onAddBlock(kind: "CATEGORY" | "CHECKLIST" | "COLUMNS") {
    startTransition(async () => {
      await persistDraft({ revalidate: false });
      await addBlock(page.id, kind);
      setDirty(false);
      router.refresh();
    });
  }

  function onCreateChild(e: React.FormEvent) {
    e.preventDefault();
    const t = childTitle.trim();
    if (!t) return;
    startTransition(async () => {
      await persistDraft();
      await createChildPage(page.section, page.id, t);
    });
  }

  function onDeletePage() {
    if (!confirm("Delete this page and all sub-pages?")) return;
    startTransition(async () => {
      await persistDraft();
      await deletePage(page.id);
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="page-title">
            Page title
          </label>
          <input
            id="page-title"
            className="w-full border-0 border-b-2 border-transparent bg-transparent pb-1 text-2xl font-semibold tracking-tight text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-0"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Page title"
          />
          <p className="mt-2 text-sm text-slate-500">
            Changes save automatically after you pause typing, or use Save now.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:pt-1">
          {saveHint === "saving" && (
            <span className="text-xs text-slate-500">Saving…</span>
          )}
          {saveHint === "saved" && (
            <span className="text-xs font-medium text-emerald-600">
              All changes saved
            </span>
          )}
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            onClick={save}
            disabled={pending}
          >
            {pending ? "Saving…" : "Save now"}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
          onClick={() => onAddBlock("CATEGORY")}
          disabled={pending}
        >
          + Category block
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
          onClick={() => onAddBlock("CHECKLIST")}
          disabled={pending}
        >
          + Checklist block
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
          onClick={() => onAddBlock("COLUMNS")}
          disabled={pending}
        >
          + Column block (2–3 columns)
        </button>
      </div>

      <div className="space-y-5">
        {blocks.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
            Add a category, column layout, or checklist block to start this
            section of your report.
          </p>
        )}
        {blocks.map((b, i) => (
          <div
            key={b.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {b.type === "CATEGORY"
                  ? "Category"
                  : b.type === "CHECKLIST"
                    ? "Checklist"
                    : "Columns"}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                  onClick={() => moveBlock(i, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                  onClick={() => moveBlock(i, 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  onClick={() => removeBlockAt(i)}
                >
                  Remove
                </button>
              </div>
            </div>
            <input
              className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Heading (optional)"
              value={b.title ?? ""}
              onChange={(e) => {
                const v = e.target.value || null;
                if (b.type === "CATEGORY") updateCategory(i, { title: v });
                else if (b.type === "CHECKLIST")
                  updateChecklist(i, { title: v });
                else updateColumnsBlock(i, { title: v });
              }}
            />
            {b.type === "CATEGORY" && (
              <textarea
                className="min-h-[140px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                      className="mt-1.5 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                      className="px-1 text-sm text-slate-400 hover:text-red-600"
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
                      aria-label="Remove row"
                    >
                      ×
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
            {b.type === "COLUMNS" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium">Layout</span>
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                      value={sortedColumns(b).length}
                      onChange={(e) =>
                        setColumnCount(i, Number(e.target.value) as 2 | 3)
                      }
                    >
                      <option value={2}>2 columns</option>
                      <option value={3}>3 columns</option>
                    </select>
                  </label>
                  <span className="text-xs text-slate-400">
                    One bullet per line in each column. Optional column headings
                    below.
                  </span>
                </div>
                <div
                  className={`grid gap-4 ${sortedColumns(b).length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
                >
                  {sortedColumns(b).map((col, ci) => (
                    <div
                      key={col.id}
                      className="flex min-h-0 flex-col rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                    >
                      <input
                        className="mb-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 placeholder:text-slate-400"
                        placeholder={`Column ${ci + 1} heading (optional)`}
                        value={col.heading ?? ""}
                        onChange={(e) =>
                          updateColumnField(i, ci, "heading", e.target.value)
                        }
                      />
                      <textarea
                        className="min-h-[160px] w-full flex-1 resize-y rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="One bullet per line"
                        value={col.body}
                        onChange={(e) =>
                          updateColumnField(i, ci, "body", e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">
          Nested page
        </h3>
        <p className="mb-3 text-sm text-slate-500">
          For a large initiative (e.g. its own status area), add a sub-page under
          this one.
        </p>
        <form
          onSubmit={onCreateChild}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Sub-page title"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            disabled={pending}
          >
            Add sub-page
          </button>
        </form>
      </section>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <button
          type="button"
          className="text-sm text-red-600 hover:underline"
          onClick={onDeletePage}
        >
          Delete this page…
        </button>
      </div>
    </div>
  );
}
