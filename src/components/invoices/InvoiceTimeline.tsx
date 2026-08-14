import { formatDate, formatDateShort } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, Send } from "lucide-react";

interface InvoiceTimelineProps {
  status: string;
  createdAt: Date | string;
  sentAt?: Date | string | null;
  paidAt?: Date | string | null;
}

export function InvoiceTimeline({
  status,
  createdAt,
  sentAt,
  paidAt,
}: InvoiceTimelineProps) {
  const steps = [
    {
      title: "Invoice Dibuat",
      description: `Draft created successfully on ${formatDateShort(createdAt)}`,
      completed: true,
      icon: Clock,
      color: "text-muted-foreground",
    },
    {
      title: "Invoice Dikirim",
      description:
        status === "DRAFT"
          ? "Not sent to customer yet"
          : `Link sent via WhatsApp / Email on ${
              sentAt ? formatDateShort(sentAt) : formatDateShort(createdAt)
            }`,
      completed: status !== "DRAFT",
      icon: Send,
      color: status !== "DRAFT" ? "text-primary" : "text-muted-foreground/40",
    },
    {
      title: "Pembayaran Lunas",
      description:
        status === "PAID"
          ? `Payment confirmed via Midtrans QRIS/VA on ${
              paidAt ? formatDate(paidAt) : "today"
            }`
          : "Waiting for customer payment",
      completed: status === "PAID",
      icon: CheckCircle2,
      color: status === "PAID" ? "text-success" : "text-muted-foreground/40",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
        Riwayat Status Tagihan
      </h3>
      <div className="relative border-l border-border pl-6 space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;

          return (
            <div key={idx} className="relative">
              {/* Connector Bullet */}
              <span
                className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-4 ring-card`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    step.completed ? step.color : "text-border"
                  }`}
                />
              </span>
              <div className="space-y-0.5">
                <p
                  className={`text-xs font-bold leading-none ${
                    step.completed ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[11.5px] text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
