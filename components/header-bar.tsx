"use client";

import { signOut } from "next-auth/react";

export function HeaderBar() {
  return (
    <header className="flex flex-wrap items-center justify-end gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:px-8">
      <a
        className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800"
        href="/api/export/pdf"
        target="_blank"
        rel="noreferrer"
      >
        Export PDF
      </a>
      <button
        type="button"
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sign out
      </button>
    </header>
  );
}
