const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ROOTS = [
  { section: "MARKETING", title: "Marketing Status Report", slug: "marketing-root" },
  { section: "SALESFORCE", title: "Salesforce Status Report", slug: "salesforce-root" },
  {
    section: "ADDITIONAL_PROJECTS",
    title: "Additional Projects Status Report",
    slug: "additional-projects-root",
  },
];

async function main() {
  for (const r of ROOTS) {
    const existing = await prisma.page.findFirst({
      where: { section: r.section, parentId: null, slug: r.slug },
    });
    if (!existing) {
      await prisma.page.create({
        data: {
          section: r.section,
          parentId: null,
          title: r.title,
          slug: r.slug,
          sortOrder: 0,
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
