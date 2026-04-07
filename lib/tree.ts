import type {
  BlockColumn,
  Bullet,
  ChecklistItem,
  ContentBlock,
  Page,
} from "@prisma/client";

export type PageWithBlocks = Page & {
  blocks: (ContentBlock & {
    bullets: Bullet[];
    items: ChecklistItem[];
    columns: BlockColumn[];
  })[];
};

export type TreeNode<T extends Page> = T & { children: TreeNode<T>[] };

export function buildTree<T extends Page>(pages: T[]): TreeNode<T>[] {
  const map = new Map<string, TreeNode<T>>();
  for (const p of pages) {
    map.set(p.id, { ...p, children: [] } as TreeNode<T>);
  }
  const roots: TreeNode<T>[] = [];
  for (const p of pages) {
    const node = map.get(p.id)!;
    if (p.parentId) {
      const parent = map.get(p.parentId);
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  function sortRec(n: TreeNode<T>) {
    n.children.sort((a, b) => a.sortOrder - b.sortOrder);
    n.children.forEach(sortRec);
  }
  roots.sort((a, b) => a.sortOrder - b.sortOrder);
  roots.forEach(sortRec);
  return roots;
}

export function flattenTreeDFS<T extends Page>(nodes: TreeNode<T>[]): TreeNode<T>[] {
  const out: TreeNode<T>[] = [];
  function walk(ns: TreeNode<T>[]) {
    for (const n of ns) {
      out.push(n);
      if (n.children.length) walk(n.children);
    }
  }
  walk(nodes);
  return out;
}

export type PageNode = TreeNode<Page>;
export type PageNodeWithBlocks = TreeNode<PageWithBlocks>;
