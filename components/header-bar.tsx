"use client";

import { signOut } from "next-auth/react";

export function HeaderBar() {
  return (
    <header className="flex flex-wrap items-center justify-end gap-3 border-b border-slate-200 bg-white px-8 py-3.5">
      <a
        className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        href="/api/export/pdf"
        target="_blank"
        rel="noreferrer"
      >
        Export PDF
      </a>
      <button
        type="button"
        className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sign out
      </button>
    </header>
  );
}
