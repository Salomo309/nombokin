# Metrik Minimal — Nombokin (query manual terjadwal)

> Jalankan mingguan via `psql -f` atau `db:studio`. Agregat saja, tanpa PII.
> Dashboard hanya dibangun bila angka dipakai rutin
> (pola: `getBusinessMetrics()` meniru `getReportSummary()`).

## 1. Konversi FREE → langganan berbayar

Langganan sukses per bulan (pembayaran pertama = konversi):

```sql
SELECT to_char("createdAt", ''YYYY-MM'') AS bulan,
       count(*) AS langganan_sukses
FROM "Payment"
WHERE type = ''SUBSCRIPTION'' AND status = ''SUCCESS''
GROUP BY 1 ORDER BY 1;
```

Basis: tenant baru per bulan (untuk rasio konversi):

```sql
SELECT to_char("createdAt", ''YYYY-MM'') AS bulan,
       count(*) AS tenant_baru
FROM "Tenant"
GROUP BY 1 ORDER BY 1;
```

## 2. Invoice per tenant per bulan (ikuti definisi kuota: termasuk yang dihapus)

```sql
SELECT to_char("createdAt", ''YYYY-MM'') AS bulan,
       "tenantId",
       count(*) AS invoice
FROM "Invoice"
WHERE type = ''INVOICE''
GROUP BY 1, 2 ORDER BY 1, 3 DESC;
```

## 3. Payment success rate (INVOICE vs SUBSCRIPTION)

```sql
SELECT type, status, count(*)
FROM "Payment"
GROUP BY 1, 2 ORDER BY 1, 2;
```

## Baseline (Okt 2026)

_Baseline 5 Okt 2026 (produksi): langganan sukses 1 (Sep 2026); tenant: 1 Agu + 1 Sep 2026; payment: SUBSCRIPTION 1 SUCCESS, INVOICE 2 SUCCESS / 3 PENDING._

