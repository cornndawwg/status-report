import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/auth";
import { ReportPdfDocument } from "@/components/pdf/report-document";
import { getFullReportForPdf } from "@/lib/report-pdf-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sections = await getFullReportForPdf();
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const buffer = await renderToBuffer(
    <ReportPdfDocument sections={sections} generatedAt={generatedAt} />,
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="status-report.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
