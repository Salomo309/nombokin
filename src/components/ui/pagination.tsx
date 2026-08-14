"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-4">
      <p className="text-xs text-muted-foreground tabular-nums">
        Menampilkan {start}–{end} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="text-xs"
        >
          Sebelumnya
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          Halaman {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="text-xs"
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
