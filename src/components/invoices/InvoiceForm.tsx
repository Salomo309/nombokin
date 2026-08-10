"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, FileText, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PDFPreview } from "@/components/invoices/PDFPreview";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Customer {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  whatsapp?: string | null;
}

interface InvoiceItem {
  id?: string;
  description: string;
  qty: number;
  unitPrice: number;
}

interface InvoiceFormProps {
  type: "INVOICE" | "QUOTATION";
  initialData?: {
    id: string;
    number: string;
    customerId?: string | null;
    issueDate: string | Date;
    dueDate: string | Date;
    discountPercent: number;
    taxPercent: number;
    notes?: string | null;
    terms?: string | null;
    items: InvoiceItem[];
  };
}

export function InvoiceForm({ type, initialData }: InvoiceFormProps) {
  const router = useRouter();

  // Load existing customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialData?.customerId || "NEW"
  );

  // Tenant / Business details for preview
  const [tenantName, setTenantName] = useState("");
  const [letterheadSignature, setLetterheadSignature] = useState("");
  const [isWatermarked, setIsWatermarked] = useState(true);

  // Inline customer fields (when ID is "NEW")
  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");

  // Dates
  const [issueDate, setIssueDate] = useState(
    initialData
      ? new Date(initialData.issueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items || [{ description: "", qty: 1, unitPrice: 0 }]
  );

  // Adjustments
  const [discountPercent, setDiscountPercent] = useState(
    initialData?.discountPercent || 0
  );
  const [taxPercent, setTaxPercent] = useState(initialData?.taxPercent || 0);

  // Metadata
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [terms, setTerms] = useState(initialData?.terms || "");

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Fetch customers & tenant info
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, meRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/auth/me"),
        ]);
        
        if (custRes.ok) {
          const custData = await custRes.json();
          setCustomers(custData);
        }
        if (meRes.ok) {
          const meData = await meRes.json();
          setTenantName(meData.tenant.name);
          setLetterheadSignature(meData.tenant.letterheadSignature || "");
          setIsWatermarked(meData.tenant.subscription.tier === "FREE");
        }
      } catch (err) {
        console.error("Gagal memuat data formulir:", err);
      }
    }
    loadData();
  }, []);

  // Update inline customer preview when selecting existing customer
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const previewCustomerName = activeCustomer ? activeCustomer.name : customerName;
  const previewCustomerCompany = activeCustomer ? activeCustomer.company || "" : customerCompany;
  const previewCustomerEmail = activeCustomer ? activeCustomer.email || "" : customerEmail;
  const previewCustomerWhatsapp = activeCustomer ? activeCustomer.whatsapp || "" : customerWhatsapp;

  const handleAddItem = () => {
    setItems([...items, { description: "", qty: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Basic validation
    if (selectedCustomerId === "NEW" && !customerName) {
      setError("Nama pelanggan wajib diisi");
      setSaving(false);
      return;
    }
    if (items.some((item) => !item.description || item.qty <= 0 || item.unitPrice < 0)) {
      setError("Semua baris item wajib diisi dengan jumlah & harga yang benar");
      setSaving(false);
      return;
    }

    const payload = {
      type,
      customerId: selectedCustomerId === "NEW" ? undefined : selectedCustomerId,
      customerName: selectedCustomerId === "NEW" ? customerName : undefined,
      customerCompany: selectedCustomerId === "NEW" ? customerCompany || undefined : undefined,
      customerEmail: selectedCustomerId === "NEW" ? customerEmail || undefined : undefined,
      customerWhatsapp: selectedCustomerId === "NEW" ? customerWhatsapp || undefined : undefined,
      issueDate,
      dueDate,
      items,
      discountPercent,
      taxPercent,
      notes,
      terms,
    };

    try {
      const url = initialData
        ? `/api/invoices/${initialData.id}`
        : "/api/invoices";
      
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(type === "INVOICE" ? "/invoices" : "/quotations");
        router.refresh();
      } else {
        const errorData = await res.json();
        if (errorData.code === "LIMIT_EXCEEDED") {
          setShowLimitModal(true);
        } else {
          setError(errorData.error || "Gagal menyimpan invoice");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan koneksi server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
      {/* LEFT PANEL: The Editor Form */}
      <div className="space-y-6 lg:col-span-7">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(type === "INVOICE" ? "/invoices" : "/quotations")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 shadow-xs"
          >
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Dokumen"}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200/50 p-4 text-xs font-medium text-red-700">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Pilih Pelanggan
                </label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={(val) => setSelectedCustomerId(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pelanggan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">+ Pelanggan Baru</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Inline Customer Form Fields */}
              {selectedCustomerId === "NEW" && (
                <div className="grid grid-cols-1 gap-4 rounded-lg bg-secondary/30 p-4 border border-border/50 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Nama Pelanggan *
                    </label>
                    <Input
                      placeholder="Contoh: Raka Pratama"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Perusahaan / Bisnis
                    </label>
                    <Input
                      placeholder="Contoh: CV Nusantara Kreatif"
                      value={customerCompany}
                      onChange={(e) => setCustomerCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Contoh: raka@kreatif.co.id"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Nomor WhatsApp (HP)
                    </label>
                    <Input
                      placeholder="Contoh: 08123456789"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Issue & Due Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Tanggal Terbit
                  </label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Tanggal Jatuh Tempo
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <h3 className="font-serif font-bold text-sm text-foreground">
                  Daftar Pekerjaan / Produk
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Baris
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-lg border border-border/50 p-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Deskripsi jasa atau barang..."
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex gap-3 sm:w-80 shrink-0">
                      <div className="w-16">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.qty || ""}
                          onChange={(e) =>
                            handleItemChange(index, "qty", parseInt(e.target.value) || 0)
                          }
                          className="text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Harga Satuan (Rp)"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="text-right"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Adjustments: Discount and PPN */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Diskon (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Contoh: 10"
                    value={discountPercent || ""}
                    onChange={(e) =>
                      setDiscountPercent(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex items-center justify-between border border-border rounded-lg p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Kenakan Pajak (PPN 11%)
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Toggle untuk mengenakan PPN standar 11%.
                    </p>
                  </div>
                  <Switch
                    checked={taxPercent === 11}
                    onCheckedChange={(checked) => setTaxPercent(checked ? 11 : 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Catatan Tambahan
                </label>
                <Textarea
                  placeholder="Keterangan opsional untuk klien..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Syarat & Ketentuan Pembayaran
                </label>
                <Textarea
                  placeholder="Contoh: Pembayaran ditransfer ke rekening BCA 1234567 a/n Studio Raka..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* RIGHT PANEL: Live PDF Stationery Preview (Sticky) */}
      <div className="lg:col-span-5 lg:sticky lg:top-8 overflow-y-auto max-h-[85vh] hidden lg:block">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> Pratinjau Live (Kertas)
        </p>
        <PDFPreview
          type={type}
          number={initialData?.number}
          tenantName={tenantName}
          letterheadSignature={letterheadSignature}
          customerName={previewCustomerName}
          customerCompany={previewCustomerCompany}
          customerEmail={previewCustomerEmail}
          customerWhatsapp={previewCustomerWhatsapp}
          issueDate={issueDate}
          dueDate={dueDate}
          items={items}
          discountPercent={discountPercent}
          taxPercent={taxPercent}
          notes={notes}
          terms={terms}
          isWatermarked={isWatermarked}
        />
      </div>

      {/* Upgrade Limit Dialog Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Batas Limit Bulanan Tercapai</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Akun free Anda dibatasi maksimal <strong>5 invoice per bulan</strong>. 
              Upgrade ke paket <strong>PRO</strong> seharga Rp29.000/bulan untuk pembuatan invoice tanpa batas, custom logo branding, dan mengaktifkan pembayaran langsung lewat QRIS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowLimitModal(false)}>
              Tutup
            </Button>
            <Button onClick={() => router.push("/settings?tab=langganan")}>
              Upgrade Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
