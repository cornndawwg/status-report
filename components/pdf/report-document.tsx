import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PdfSection } from "@/lib/report-pdf-data";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111",
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    fontFamily: "Helvetica-Bold",
  },
  pageTitle: {
    fontSize: 14,
    marginTop: 14,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  categoryTitle: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  bullet: {
    marginLeft: 12,
    marginBottom: 3,
  },
  checklistRow: {
    marginLeft: 8,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  check: {
    width: 12,
    fontSize: 10,
    marginRight: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 9,
    color: "#666",
    textAlign: "center",
  },
});

export function ReportPdfDocument({
  sections,
  generatedAt,
}: {
  sections: PdfSection[];
  generatedAt: string;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Status report</Text>
        <Text style={{ marginBottom: 8, color: "#444" }}>
          Generated {generatedAt}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 10, color: "#333" }}>
          Sections: {sections.map((s) => s.label).join(" · ")}
        </Text>
        <Text style={styles.footer}>Status report (exported)</Text>
      </Page>
      {sections.map((sec) => (
        <Page key={sec.section} size="LETTER" style={styles.page} wrap>
          <Text style={styles.sectionTitle}>{sec.label}</Text>
          {sec.pages.map((pg, idx) => (
            <View key={idx} wrap={false}>
              <Text style={styles.pageTitle}>{pg.title}</Text>
              {pg.blocks.map((b, bi) =>
                b.type === "CATEGORY" ? (
                  <View key={bi} wrap={false}>
                    {b.title ? (
                      <Text style={styles.categoryTitle}>{b.title}</Text>
                    ) : null}
                    {b.bullets
                      .filter((line) => line.trim().length > 0)
                      .map((line, li) => (
                        <Text key={li} style={styles.bullet}>
                          • {line}
                        </Text>
                      ))}
                  </View>
                ) : (
                  <View key={bi} wrap={false}>
                    {b.title ? (
                      <Text style={styles.categoryTitle}>{b.title}</Text>
                    ) : null}
                    {b.items.map((it, ii) => (
                      <View key={ii} style={styles.checklistRow} wrap={false}>
                        <Text style={styles.check}>
                          {it.checked ? "☑" : "☐"}
                        </Text>
                        <Text style={{ flex: 1 }}>{it.label}</Text>
                      </View>
                    ))}
                  </View>
                ),
              )}
            </View>
          ))}
          <Text
            style={[styles.footer, { position: "relative", marginTop: 24 }]}
          >
            {sec.label}
          </Text>
        </Page>
      ))}
    </Document>
  );
}
