"use client";

import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { Toaster, ToastProvider } from "@/components/ui/toast";

export function UIProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
        <Toaster />
      </ConfirmProvider>
    </ToastProvider>
  );
}
