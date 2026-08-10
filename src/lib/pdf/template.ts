import PdfPrinter from "pdfmake";
import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { PDF_COLORS } from "./fonts";
import { formatRupiah, formatDate, STATUS_LABELS } from "@/lib/utils";

// pdfmake uses virtual file system for fonts in Node.js
// We use the built-in vfs from pdfmake/build/vfs_fonts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMakeFonts = require("pdfmake/build/vfs_fonts");

const printer = new PdfPrinter({
  Roboto: {
    normal: Buffer.from(pdfMakeFonts["Roboto-Regular.ttf"], "base64"),
    bold: Buffer.from(pdfMakeFonts["Roboto-Medium.ttf"], "base64"),
    italics: Buffer.from(pdfMakeFonts["Roboto-Italic.ttf"], "base64"),
    bolditalics: Buffer.from(pdfMakeFonts["Roboto-MediumItalic.ttf"], "base64"),
  },
});

interface InvoiceItemData {
  description: string;
  qty: number | string;
  unitPrice: number | string;
  total: number | string;
}

interface InvoiceData {
  number: string;
  type: string;
  status: string;
  issueDate: Date | string;
  dueDate: Date | string;
  subtotal: number | string;
  discountPercent: number | string;
  taxPercent: number | string;
  total: number | string;
  notes?: string | null;
  terms?: string | null;
  items: InvoiceItemData[];
  customer?: {
    name: string;
    company?: string | null;
    email?: string | null;
    whatsapp?: string | null;
  } | null;
}

interface TenantData {
  name: string;
  logoUrl?: string | null;
  letterheadSignature?: string | null;
  watermarkText?: string;
}

interface PDFOptions {
  isWatermarked?: boolean;
}

function toNum(val: number | string | null | undefined): number {
  if (val === null || val === undefined) return 0;
  return typeof val === "string" ? parseFloat(val) : val;
}

export function generateInvoicePDF(
  invoice: InvoiceData,
  tenant: TenantData,
  options: PDFOptions = {}
): Buffer {
  const subtotal = toNum(invoice.subtotal);
  const discountPercent = toNum(invoice.discountPercent);
  const taxPercent = toNum(invoice.taxPercent);
  const total = toNum(invoice.total);

  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);

  const docLabel = invoice.type === "INVOICE" ? "INVOICE" : "PENAWARAN";

  // ---- Header ----
  const headerContent: Content[] = [
    {
      columns: [
        // Left: Tenant name / logo
        {
          stack: [
            {
              text: tenant.name.toUpperCase(),
              fontSize: 22,
              bold: true,
              color: PDF_COLORS.inkDark,
              font: "Roboto",
            },
            tenant.letterheadSignature
              ? {
                  text: tenant.letterheadSignature,
                  fontSize: 9,
                  color: PDF_COLORS.inkMuted,
                  margin: [0, 2, 0, 0],
                }
              : { text: "" },
          ],
          width: "*",
        },
        // Right: Document type + number
        {
          stack: [
            {
              text: docLabel,
              fontSize: 28,
              bold: true,
              color: PDF_COLORS.accent,
              alignment: "right",
              font: "Roboto",
            },
            {
              text: invoice.number,
              fontSize: 11,
              color: PDF_COLORS.inkMuted,
              alignment: "right",
              margin: [0, 2, 0, 0],
            },
          ],
          width: "auto",
        },
      ],
      margin: [0, 0, 0, 24],
    },
    // Hairline divider
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5,
          lineColor: PDF_COLORS.border,
        },
      ],
      margin: [0, 0, 0, 20],
    },
  ];

  // ---- Meta row (dates + customer) ----
  const metaContent: Content = {
    columns: [
      // Customer info
      {
        stack: [
          { text: "TAGIHAN KEPADA", fontSize: 8, color: PDF_COLORS.inkMuted, bold: true, margin: [0, 0, 0, 4] },
          {
            text: invoice.customer?.name ?? "—",
            fontSize: 12,
            bold: true,
            color: PDF_COLORS.inkDark,
          },
          invoice.customer?.company
            ? { text: invoice.customer.company, fontSize: 10, color: PDF_COLORS.inkBody }
            : { text: "" },
          invoice.customer?.email
            ? { text: invoice.customer.email, fontSize: 9, color: PDF_COLORS.inkMuted }
            : { text: "" },
          invoice.customer?.whatsapp
            ? { text: invoice.customer.whatsapp, fontSize: 9, color: PDF_COLORS.inkMuted }
            : { text: "" },
        ],
        width: "*",
      },
      // Dates + status
      {
        stack: [
          {
            columns: [
              { text: "Tanggal Invoice", fontSize: 9, color: PDF_COLORS.inkMuted, width: 100 },
              {
                text: formatDate(invoice.issueDate),
                fontSize: 9,
                color: PDF_COLORS.inkBody,
                bold: true,
                width: "*",
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 4],
          },
          {
            columns: [
              { text: "Jatuh Tempo", fontSize: 9, color: PDF_COLORS.inkMuted, width: 100 },
              {
                text: formatDate(invoice.dueDate),
                fontSize: 9,
                color: PDF_COLORS.inkBody,
                bold: true,
                width: "*",
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 4],
          },
          {
            columns: [
              { text: "Status", fontSize: 9, color: PDF_COLORS.inkMuted, width: 100 },
              {
                text: STATUS_LABELS[invoice.status] ?? invoice.status,
                fontSize: 9,
                color:
                  invoice.status === "PAID"
                    ? PDF_COLORS.success
                    : invoice.status === "OVERDUE"
                    ? "#B91C1C"
                    : PDF_COLORS.inkBody,
                bold: true,
                width: "*",
                alignment: "right",
              },
            ],
          },
        ],
        width: 220,
      },
    ],
    margin: [0, 0, 0, 28],
  };

  // ---- Items table ----
  const tableBody: any[][] = [
    // Header row
    [
      { text: "DESKRIPSI", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, border: [false, false, false, true], borderColor: [null, null, null, PDF_COLORS.border], margin: [0, 4, 0, 8] },
      { text: "QTY", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, alignment: "center", border: [false, false, false, true], borderColor: [null, null, null, PDF_COLORS.border], margin: [0, 4, 0, 8] },
      { text: "HARGA SATUAN", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, alignment: "right", border: [false, false, false, true], borderColor: [null, null, null, PDF_COLORS.border], margin: [0, 4, 0, 8] },
      { text: "TOTAL", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, alignment: "right", border: [false, false, false, true], borderColor: [null, null, null, PDF_COLORS.border], margin: [0, 4, 0, 8] },
    ],
    // Items
    ...invoice.items.map((item) => [
      { text: item.description, fontSize: 10, color: PDF_COLORS.inkDark, border: [false, false, false, true], borderColor: [null, null, null, "#F0EDE8"], margin: [0, 8, 0, 8] },
      { text: String(toNum(item.qty)), fontSize: 10, color: PDF_COLORS.inkBody, alignment: "center", border: [false, false, false, true], borderColor: [null, null, null, "#F0EDE8"], margin: [0, 8, 0, 8] },
      { text: formatRupiah(toNum(item.unitPrice)), fontSize: 10, color: PDF_COLORS.inkBody, alignment: "right", border: [false, false, false, true], borderColor: [null, null, null, "#F0EDE8"], margin: [0, 8, 0, 8] },
      { text: formatRupiah(toNum(item.total)), fontSize: 10, color: PDF_COLORS.inkDark, bold: true, alignment: "right", border: [false, false, false, true], borderColor: [null, null, null, "#F0EDE8"], margin: [0, 8, 0, 8] },
    ]),
  ];

  const tableContent: Content = {
    table: {
      headerRows: 1,
      widths: ["*", 50, 120, 100],
      body: tableBody,
    },
    layout: "lightHorizontalLines",
    margin: [0, 0, 0, 24],
  };

  // ---- Totals ----
  const totalsRows: Content[] = [
    {
      columns: [
        { text: "Subtotal", width: "*", fontSize: 10, color: PDF_COLORS.inkBody },
        { text: formatRupiah(subtotal), width: 120, fontSize: 10, color: PDF_COLORS.inkDark, bold: true, alignment: "right" },
      ],
      margin: [0, 0, 0, 6],
    },
  ];

  if (discountPercent > 0) {
    totalsRows.push({
      columns: [
        { text: `Diskon (${discountPercent}%)`, width: "*", fontSize: 10, color: PDF_COLORS.inkBody },
        { text: `- ${formatRupiah(discountAmount)}`, width: 120, fontSize: 10, color: "#B45309", bold: true, alignment: "right" },
      ],
      margin: [0, 0, 0, 6],
    });
  }

  if (taxPercent > 0) {
    totalsRows.push({
      columns: [
        { text: `PPN (${taxPercent}%)`, width: "*", fontSize: 10, color: PDF_COLORS.inkBody },
        { text: formatRupiah(taxAmount), width: 120, fontSize: 10, color: PDF_COLORS.inkBody, bold: true, alignment: "right" },
      ],
      margin: [0, 0, 0, 8],
    });
  }

  // Divider before total
  totalsRows.push({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: PDF_COLORS.border, dash: { length: 3 } }],
    margin: [0, 4, 0, 10],
  });

  totalsRows.push({
    columns: [
      { text: "TOTAL", width: "*", fontSize: 14, bold: true, color: PDF_COLORS.inkDark },
      { text: formatRupiah(total), width: 120, fontSize: 14, bold: true, color: PDF_COLORS.accent, alignment: "right" },
    ],
    margin: [0, 0, 0, 0],
  });

  // ---- Notes & Terms ----
  const footer: Content[] = [];

  if (invoice.notes || invoice.terms) {
    footer.push({
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: PDF_COLORS.border }],
      margin: [0, 24, 0, 16],
    });

    if (invoice.notes) {
      footer.push(
        { text: "CATATAN", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, margin: [0, 0, 0, 4] },
        { text: invoice.notes, fontSize: 9, color: PDF_COLORS.inkBody, margin: [0, 0, 0, 12] }
      );
    }
    if (invoice.terms) {
      footer.push(
        { text: "SYARAT & KETENTUAN", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, margin: [0, 0, 0, 4] },
        { text: invoice.terms, fontSize: 9, color: PDF_COLORS.inkBody }
      );
    }
  }

  // ---- Page footer ----
  footer.push({
    text: options.isWatermarked
      ? "Dibuat dengan Nombokin · nombokin.com"
      : `${tenant.name} · Dibuat dengan Nombokin`,
    fontSize: 8,
    color: PDF_COLORS.inkMuted,
    alignment: "center",
    margin: [0, 32, 0, 0],
  });

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [48, 48, 48, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: PDF_COLORS.inkDark,
      lineHeight: 1.4,
    },
    background: options.isWatermarked
      ? [
          {
            canvas: [
              {
                type: "rect",
                x: 0,
                y: 0,
                w: 595,
                h: 842,
                color: "#FAF7F2",
              },
            ],
          },
          {
            // Watermark text rotated diagonally
            text: "DIBUAT DENGAN NOMBOKIN",
            fontSize: 36,
            bold: true,
            color: "#E7E5E4",
            opacity: 0.5,
            angle: -45,
            absolutePosition: { x: 80, y: 380 },
          } as any,
        ]
      : [
          {
            canvas: [
              {
                type: "rect",
                x: 0,
                y: 0,
                w: 595,
                h: 842,
                color: "#FAF7F2",
              },
            ],
          },
        ],
    content: [
      ...headerContent,
      metaContent,
      tableContent,
      // Totals aligned to right
      {
        stack: totalsRows,
        alignment: "right",
      } as Content,
      ...footer,
    ],
  };

  const pdfDocGenerator = printer.createPdfKitDocument(docDefinition);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    pdfDocGenerator.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    pdfDocGenerator.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDocGenerator.on("error", reject);
    pdfDocGenerator.end();
  }) as unknown as Buffer;
}

// Synchronous wrapper for API route
export async function generateInvoicePDFBuffer(
  invoice: InvoiceData,
  tenant: TenantData,
  options: PDFOptions = {}
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const subtotal = toNum(invoice.subtotal);
    const discountPercent = toNum(invoice.discountPercent);
    const taxPercent = toNum(invoice.taxPercent);
    const total = toNum(invoice.total);

    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxPercent / 100);

    const docLabel = invoice.type === "INVOICE" ? "INVOICE" : "PENAWARAN";

    const tableBody: any[][] = [
      [
        { text: "DESKRIPSI", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, border: [false, false, false, true], borderColor: [undefined, undefined, undefined, PDF_COLORS.border], margin: [0, 4, 0, 8] },
        { text: "QTY", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, alignment: "center", border: [false, false, false, true], borderColor: [undefined, undefined, undefined, PDF_COLORS.border], margin: [0, 4, 0, 8] },
        { text: "HARGA SATUAN", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, alignment: "right", border: [false, false, false, true], borderColor: [undefined, undefined, undefined, PDF_COLORS.border], margin: [0, 4, 0, 8] },
        { text: "TOTAL", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, alignment: "right", border: [false, false, false, true], borderColor: [undefined, undefined, undefined, PDF_COLORS.border], margin: [0, 4, 0, 8] },
      ],
      ...invoice.items.map((item) => [
        { text: item.description, fontSize: 10, color: PDF_COLORS.inkDark, border: [false, false, false, true], borderColor: [undefined, undefined, undefined, "#F0EDE8"], margin: [0, 8, 0, 8] },
        { text: String(toNum(item.qty)), fontSize: 10, color: PDF_COLORS.inkBody, alignment: "center", border: [false, false, false, true], borderColor: [undefined, undefined, undefined, "#F0EDE8"], margin: [0, 8, 0, 8] },
        { text: formatRupiah(toNum(item.unitPrice)), fontSize: 10, color: PDF_COLORS.inkBody, alignment: "right", border: [false, false, false, true], borderColor: [undefined, undefined, undefined, "#F0EDE8"], margin: [0, 8, 0, 8] },
        { text: formatRupiah(toNum(item.total)), fontSize: 10, color: PDF_COLORS.inkDark, bold: true, alignment: "right", border: [false, false, false, true], borderColor: [undefined, undefined, undefined, "#F0EDE8"], margin: [0, 8, 0, 8] },
      ]),
    ];

    const totalsStack: any[] = [
      {
        columns: [
          { text: "Subtotal", width: "*", fontSize: 10, color: PDF_COLORS.inkBody },
          { text: formatRupiah(subtotal), width: 120, fontSize: 10, color: PDF_COLORS.inkDark, bold: true, alignment: "right" },
        ],
        margin: [0, 0, 0, 6],
      },
      ...(discountPercent > 0
        ? [{
            columns: [
              { text: `Diskon (${discountPercent}%)`, width: "*", fontSize: 10, color: PDF_COLORS.inkBody },
              { text: `- ${formatRupiah(discountAmount)}`, width: 120, fontSize: 10, color: "#B45309", bold: true, alignment: "right" },
            ],
            margin: [0, 0, 0, 6],
          }]
        : []),
      ...(taxPercent > 0
        ? [{
            columns: [
              { text: `PPN (${taxPercent}%)`, width: "*", fontSize: 10, color: PDF_COLORS.inkBody },
              { text: formatRupiah(taxAmount), width: 120, fontSize: 10, color: PDF_COLORS.inkBody, bold: true, alignment: "right" },
            ],
            margin: [0, 0, 0, 8],
          }]
        : []),
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: PDF_COLORS.border, dash: { length: 3 } }], margin: [0, 4, 0, 10] },
      {
        columns: [
          { text: "TOTAL", width: "*", fontSize: 14, bold: true, color: PDF_COLORS.inkDark },
          { text: formatRupiah(total), width: 120, fontSize: 14, bold: true, color: PDF_COLORS.accent, alignment: "right" },
        ],
      },
    ];

    const backgroundLayers: any[] = options.isWatermarked
      ? [
          { canvas: [{ type: "rect", x: 0, y: 0, w: 595, h: 842, color: "#FAF7F2" }] },
          { text: "DIBUAT DENGAN NOMBOKIN", fontSize: 36, bold: true, color: "#E7E5E4", opacity: 0.5, angle: -45, absolutePosition: { x: 80, y: 380 } },
        ]
      : [{ canvas: [{ type: "rect", x: 0, y: 0, w: 595, h: 842, color: "#FAF7F2" }] }];

    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [48, 48, 48, 48],
      defaultStyle: { font: "Roboto", fontSize: 10, color: PDF_COLORS.inkDark, lineHeight: 1.4 },
      background: backgroundLayers,
      content: [
        // Header
        {
          columns: [
            {
              stack: [
                { text: tenant.name.toUpperCase(), fontSize: 22, bold: true, color: PDF_COLORS.inkDark },
                tenant.letterheadSignature
                  ? { text: tenant.letterheadSignature, fontSize: 9, color: PDF_COLORS.inkMuted, margin: [0, 2, 0, 0] }
                  : { text: "" },
              ],
              width: "*",
            },
            {
              stack: [
                { text: docLabel, fontSize: 28, bold: true, color: PDF_COLORS.accent, alignment: "right" },
                { text: invoice.number, fontSize: 11, color: PDF_COLORS.inkMuted, alignment: "right", margin: [0, 2, 0, 0] },
              ],
              width: "auto",
            },
          ],
          margin: [0, 0, 0, 24],
        },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: PDF_COLORS.border }], margin: [0, 0, 0, 20] },
        // Meta
        {
          columns: [
            {
              stack: [
                { text: "TAGIHAN KEPADA", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, margin: [0, 0, 0, 4] },
                { text: invoice.customer?.name ?? "—", fontSize: 12, bold: true, color: PDF_COLORS.inkDark },
                ...(invoice.customer?.company ? [{ text: invoice.customer.company, fontSize: 10, color: PDF_COLORS.inkBody }] : []),
                ...(invoice.customer?.email ? [{ text: invoice.customer.email, fontSize: 9, color: PDF_COLORS.inkMuted }] : []),
              ],
              width: "*",
            },
            {
              stack: [
                { columns: [{ text: "Tanggal Invoice", fontSize: 9, color: PDF_COLORS.inkMuted, width: 100 }, { text: formatDate(invoice.issueDate), fontSize: 9, color: PDF_COLORS.inkBody, bold: true, width: "*", alignment: "right" }], margin: [0, 0, 0, 4] },
                { columns: [{ text: "Jatuh Tempo", fontSize: 9, color: PDF_COLORS.inkMuted, width: 100 }, { text: formatDate(invoice.dueDate), fontSize: 9, color: PDF_COLORS.inkBody, bold: true, width: "*", alignment: "right" }], margin: [0, 0, 0, 4] },
                { columns: [{ text: "Status", fontSize: 9, color: PDF_COLORS.inkMuted, width: 100 }, { text: STATUS_LABELS[invoice.status] ?? invoice.status, fontSize: 9, color: invoice.status === "PAID" ? PDF_COLORS.success : PDF_COLORS.inkBody, bold: true, width: "*", alignment: "right" }] },
              ],
              width: 220,
            },
          ],
          margin: [0, 0, 0, 28],
        },
        // Table
        { table: { headerRows: 1, widths: ["*", 50, 120, 100], body: tableBody }, layout: "lightHorizontalLines", margin: [0, 0, 0, 24] },
        // Totals
        { stack: totalsStack, alignment: "right" },
        // Notes
        ...(invoice.notes || invoice.terms
          ? [
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: PDF_COLORS.border }], margin: [0, 24, 0, 16] } as Content,
              ...(invoice.notes ? [{ text: "CATATAN", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, margin: [0, 0, 0, 4] } as Content, { text: invoice.notes, fontSize: 9, color: PDF_COLORS.inkBody, margin: [0, 0, 0, 12] } as Content] : []),
              ...(invoice.terms ? [{ text: "SYARAT & KETENTUAN", fontSize: 8, bold: true, color: PDF_COLORS.inkMuted, margin: [0, 0, 0, 4] } as Content, { text: invoice.terms, fontSize: 9, color: PDF_COLORS.inkBody } as Content] : []),
            ]
          : []),
        // Footer
        {
          text: options.isWatermarked ? "Dibuat dengan Nombokin · nombokin.com" : `${tenant.name} · Dibuat dengan Nombokin`,
          fontSize: 8,
          color: PDF_COLORS.inkMuted,
          alignment: "center",
          margin: [0, 32, 0, 0],
        },
      ],
    };

    const doc = printer.createPdfKitDocument(docDefinition);
    const bufferChunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => bufferChunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(bufferChunks)));
    doc.on("error", reject);
    doc.end();
  });
}
