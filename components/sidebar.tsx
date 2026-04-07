"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Section } from "@prisma/client";
import type { PageNode } from "@/lib/tree";
import { SECTION_LABEL, SECTION_ORDER, sectionToSlug } from "@/lib/sections";

function NavBranch({
  nodes,
  section,
  depth,
  currentPageId,
  onNavigate,
}: {
  nodes: PageNode[];
  section: Section;
  depth: number;
  currentPageId: string;
  onNavigate?: () => void;
}) {
  return (
    <ul
      className={
        depth === 0 ? "space-y-0.5" : "ml-3 mt-0.5 space-y-0.5 border-l border-zinc-700 pl-2"
      }
    >
      {nodes.map((n) => {
        const href = `/section/${sectionToSlug(section)}/page/${n.id}`;
        const active = n.id === currentPageId;
        return (
          <li key={n.id}>
            <Link
              href={href}
              onClick={onNavigate}
              className={`block rounded px-2 py-1 text-sm ${
                active
                  ? "bg-zinc-700 font-medium text-white"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
                onNavigate={onNavigate}
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
    () => Object.fromEntries(SECTION_ORDER.map((s) => [s, true])) as Record<Section, boolean>,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow md:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label="Toggle navigation"
      >
        Menu
      </button>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 max-w-[85vw] overflow-y-auto border-r border-zinc-800 bg-zinc-950 px-3 py-4 pt-14 transition-transform md:static md:z-0 md:flex md:w-64 md:max-w-none md:translate-x-0 md:flex-col md:pt-4 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-4 hidden text-xs font-semibold uppercase tracking-wide text-zinc-500 md:block">
          Status report
        </div>
        <nav className="space-y-1">
          {SECTION_ORDER.map((section) => {
            const expanded = sectionOpen[section];
            return (
              <div key={section} className="rounded-lg bg-zinc-900/50">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-2 py-2 text-left text-sm font-medium text-zinc-100"
                  onClick={() =>
                    setSectionOpen((o) => ({ ...o, [section]: !o[section] }))
                  }
                >
                  <span>{SECTION_LABEL[section]}</span>
                  <span className="text-zinc-500">{expanded ? "−" : "+"}</span>
                </button>
                {expanded && (
                  <div className="pb-2">
                    <NavBranch
                      nodes={trees[section]}
                      section={section}
                      depth={0}
                      currentPageId={currentPageId}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="hidden md:block md:w-64 md:shrink-0" aria-hidden />
    </>
  );
}
