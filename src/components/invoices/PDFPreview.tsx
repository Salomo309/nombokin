"use client";

import { formatRupiah, formatDateShort, STATUS_LABELS } from "@/lib/utils";

interface PreviewItem {
  description: string;
  qty: number;
  unitPrice: number;
}

interface PDFPreviewProps {
  type: "INVOICE" | "QUOTATION";
  number?: string;
  tenantName: string;
  letterheadSignature?: string;
  customerName?: string;
  customerCompany?: string;
  customerEmail?: string;
  customerWhatsapp?: string;
  issueDate?: string;
  dueDate?: string;
  items: PreviewItem[];
  discountPercent: number;
  taxPercent: number;
  notes?: string;
  terms?: string;
  status?: string;
  isWatermarked?: boolean;
}

export function PDFPreview({
  type,
  number = "INV-2026-XXXX",
  tenantName,
  letterheadSignature,
  customerName,
  customerCompany,
  customerEmail,
  customerWhatsapp,
  issueDate,
  dueDate,
  items,
  discountPercent,
  taxPercent,
  notes,
  terms,
  status = "DRAFT",
  isWatermarked = true,
}: PDFPreviewProps) {
  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const total = afterDiscount + taxAmount;

  return (
    <div className="relative w-full max-w-[800px] overflow-hidden rounded-xl border border-border bg-[#FAF7F2] p-8 shadow-sm text-[#1C1917] font-sans paper-sheet">
      
      {/* FREE Tier watermark background */}
      {isWatermarked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] rotate-[-45deg] z-0">
          <p className="text-6xl font-black uppercase tracking-widest">
            Dibuat dengan Nombokin
          </p>
        </div>
      )}

      <div className="relative z-10 space-y-8">
        {/* Header Block */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1C1917] uppercase">
              {tenantName || "Bisnis Saya"}
            </h2>
            {letterheadSignature && (
              <p className="font-serif text-xs italic text-[#57534E]">
                {letterheadSignature}
              </p>
            )}
          </div>
          <div className="text-right">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#C2410C] uppercase leading-none">
              {type === "INVOICE" ? "Invoice" : "Penawaran"}
            </h1>
            <p className="text-xs font-semibold text-[#A8A29E] mt-1.5 tabular-nums">
              {number}
            </p>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="h-[0.5px] w-full bg-[#E7E5E4]" />

        {/* Customer & Meta Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Tagihan Kepada */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">
              TAGIHAN KEPADA
            </p>
            <p className="font-serif text-sm font-bold text-[#1C1917]">
              {customerName || "—"}
            </p>
            {customerCompany && (
              <p className="text-xs text-[#57534E]">{customerCompany}</p>
            )}
            {(customerEmail || customerWhatsapp) && (
              <div className="text-[11px] text-[#A8A29E] mt-1 space-y-0.5">
                {customerEmail && <p>{customerEmail}</p>}
                {customerWhatsapp && <p>{customerWhatsapp}</p>}
              </div>
            )}
          </div>

          {/* Dates & Status */}
          <div className="flex flex-col gap-1.5 text-xs sm:items-end">
            <div className="flex gap-4 sm:justify-end">
              <span className="text-[#A8A29E]">Tanggal:</span>
              <span className="font-semibold tabular-nums text-right w-24">
                {issueDate ? formatDateShort(new Date(issueDate)) : "—"}
              </span>
            </div>
            <div className="flex gap-4 sm:justify-end">
              <span className="text-[#A8A29E]">Jatuh Tempo:</span>
              <span className="font-semibold tabular-nums text-right w-24">
                {dueDate ? formatDateShort(new Date(dueDate)) : "—"}
              </span>
            </div>
            <div className="flex gap-4 sm:justify-end">
              <span className="text-[#A8A29E]">Status:</span>
              <span className="font-semibold text-right w-24 uppercase tracking-wider text-[11px] text-[#15803D]">
                {STATUS_LABELS[status] || status}
              </span>
            </div>
          </div>
        </div>

        {/* Table Block */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#A8A29E] font-bold">
                <th className="py-2.5">DESKRIPSI</th>
                <th className="py-2.5 text-center w-12">QTY</th>
                <th className="py-2.5 text-right w-28">HARGA SATUAN</th>
                <th className="py-2.5 text-right w-28">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#A8A29E]">
                    Belum ada item ditambahkan.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="text-[#1C1917] font-medium">
                    <td className="py-3 max-w-[200px] truncate">
                      {item.description || "Nama item..."}
                    </td>
                    <td className="py-3 text-center tabular-nums">{item.qty}</td>
                    <td className="py-3 text-right tabular-nums">
                      {formatRupiah(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-serif font-bold tabular-nums">
                      {formatRupiah(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary Column */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2 text-xs text-[#57534E]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums text-[#1C1917]">
                {formatRupiah(subtotal)}
              </span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-[#B45309]">
                <span>Diskon ({discountPercent}%)</span>
                <span className="font-semibold tabular-nums">
                  -{formatRupiah(discountAmount)}
                </span>
              </div>
            )}
            {taxPercent > 0 && (
              <div className="flex justify-between">
                <span>PPN ({taxPercent}%)</span>
                <span className="font-semibold tabular-nums">
                  {formatRupiah(taxAmount)}
                </span>
              </div>
            )}
            {/* Dotted divider */}
            <div className="border-t border-dashed border-[#E7E5E4] my-2" />
            <div className="flex justify-between font-serif text-sm font-bold text-[#1C1917]">
              <span className="text-base uppercase tracking-tight text-[#1C1917]">
                TOTAL
              </span>
              <span className="text-base text-[#C2410C] tabular-nums">
                {formatRupiah(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms Block */}
        {(notes || terms) && (
          <div className="space-y-4 pt-4 border-t border-[#E7E5E4]">
            {notes && (
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#A8A29E]">
                  CATATAN
                </p>
                <p className="text-[11px] leading-relaxed text-[#57534E]">
                  {notes}
                </p>
              </div>
            )}
            {terms && (
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#A8A29E]">
                  SYARAT & KETENTUAN
                </p>
                <p className="text-[11px] leading-relaxed text-[#57534E]">
                  {terms}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-6 text-center">
          <p className="text-[10px] text-[#A8A29E]">
            {isWatermarked
              ? "Dibuat dengan Nombokin · nombokin.com"
              : `${tenantName || "Bisnis Saya"} · Dibuat dengan Nombokin`}
          </p>
        </div>
      </div>
    </div>
  );
}
