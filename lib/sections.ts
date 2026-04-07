import type { Section } from "@prisma/client";

export const SECTION_ORDER: Section[] = [
  "MARKETING",
  "SALESFORCE",
  "ADDITIONAL_PROJECTS",
];

export const SECTION_LABEL: Record<Section, string> = {
  MARKETING: "Marketing",
  SALESFORCE: "Salesforce",
  ADDITIONAL_PROJECTS: "Additional Projects",
};

export const SECTION_SLUG: Record<Section, string> = {
  MARKETING: "marketing",
  SALESFORCE: "salesforce",
  ADDITIONAL_PROJECTS: "additional-projects",
};

const SLUG_TO_SECTION = Object.fromEntries(
  (Object.keys(SECTION_SLUG) as Section[]).map((k) => [SECTION_SLUG[k], k]),
) as Record<string, Section>;

export function slugToSection(slug: string): Section | null {
  return SLUG_TO_SECTION[slug] ?? null;
}

export function sectionToSlug(section: Section): string {
  return SECTION_SLUG[section];
}
