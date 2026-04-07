"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Section } from "@prisma/client";
import type { PageNode } from "@/lib/tree";
import { SECTION_LABEL, SECTION_ORDER, sectionToSlug } from "@/lib/sections";

function NavBranch({
  nodes,
  section,
  depth,
  currentPageId,
}: {
  nodes: PageNode[];
  section: Section;
  depth: number;
  currentPageId: string;
}) {
  return (
    <ul
      className={
        depth === 0
          ? "space-y-0.5"
          : "ml-2 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3"
      }
    >
      {nodes.map((n) => {
        const href = `/section/${sectionToSlug(section)}/page/${n.id}`;
        const active = n.id === currentPageId;
        return (
          <li key={n.id}>
            <Link
              href={href}
              className={`block rounded-md py-1.5 pl-2 pr-2 text-sm leading-snug transition ${
                active
                  ? "border-l-[3px] border-blue-600 bg-blue-50 font-medium text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {n.title}
            </Link>
            {n.children.length > 0 && (
              <NavBranch
                nodes={n.children}
                section={section}
                depth={depth + 1}
                currentPageId={currentPageId}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ trees }: { trees: Record<Section, PageNode[]> }) {
  const pathname = usePathname();
  const currentPageId = pathname.match(/\/page\/([^/]+)/)?.[1] ?? "";
  const [sectionOpen, setSectionOpen] = useState<Record<Section, boolean>>(
    () =>
      Object.fromEntries(SECTION_ORDER.map((s) => [s, true])) as Record<
        Section,
        boolean
      >,
  );

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50/90 px-4 py-6">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Report
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">
          Status updates
        </p>
      </div>
      <nav className="flex-1 space-y-2">
        {SECTION_ORDER.map((section) => {
          const expanded = sectionOpen[section];
          return (
            <div
              key={section}
              className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                onClick={() =>
                  setSectionOpen((o) => ({ ...o, [section]: !o[section] }))
                }
              >
                <span>{SECTION_LABEL[section]}</span>
                <span className="text-xs text-slate-400" aria-hidden>
                  {expanded ? "−" : "+"}
                </span>
              </button>
              {expanded && (
                <div className="border-t border-slate-100 px-2 pb-2 pt-1">
                  <NavBranch
                    nodes={trees[section]}
                    section={section}
                    depth={0}
                    currentPageId={currentPageId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
