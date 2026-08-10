"use client";

import { Menu, User } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  userName: string;
  userEmail: string;
  onOpenSidebar: () => void;
  title?: string;
}

export function Topbar({ userName, userEmail, onOpenSidebar, title }: TopbarProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-6">
      {/* Left side: mobile toggle & title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka Sidebar</span>
        </Button>
        {title ? (
          <h1 className="font-serif text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {title}
          </h1>
        ) : (
          <p className="text-sm text-muted-foreground hidden md:block">
            Selamat datang kembali, <strong className="text-foreground">{userName}</strong>
          </p>
        )}
      </div>

      {/* Right side: theme toggle & user badge */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="h-5 w-px bg-border/80" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border">
            <User className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div className="hidden flex-col text-left xl:flex">
            <span className="text-xs font-semibold text-foreground leading-none">
              {userName}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px] truncate">
              {userEmail}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
