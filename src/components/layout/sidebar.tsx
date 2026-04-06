"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Calendar,
  Users,
  Building2,
  Megaphone,
  FileText,
  Settings,
  Briefcase,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  comingSoon?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Calendrier", href: "/calendar", icon: Calendar },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Entreprises", href: "/companies", icon: Building2 },
  { label: "Campagnes", href: "/campaigns", icon: Megaphone },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Offres", href: "/offres", icon: Briefcase },
  { label: "Candidatures", href: "/candidatures", icon: ClipboardList },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.disabled ? "#" : item.href}
      aria-disabled={item.disabled}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        collapsed && "justify-center px-0",
        isActive && "bg-accent text-accent-foreground",
        !isActive && !item.disabled && "text-muted-foreground hover:bg-muted hover:text-foreground",
        item.disabled && "pointer-events-none opacity-50"
      )}
      onClick={item.disabled ? (e) => e.preventDefault() : undefined}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.comingSoon && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Bientot
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
          {item.comingSoon && " (Bientot)"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card h-screen sticky top-0 transition-all duration-200 overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center p-4", collapsed ? "flex-col gap-2" : "justify-between")}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="BreakIn" className="size-10 shrink-0" />
              <span className="text-xl font-bold tracking-tight">BreakIn</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleCollapsed} aria-label="Collapse sidebar">
              <PanelLeftClose className="size-5" />
            </Button>
          </>
        ) : (
          <>
            <img src="/icon.png" alt="BreakIn" className="size-8" />
            <Button variant="ghost" size="icon" onClick={toggleCollapsed} aria-label="Expand sidebar">
              <PanelLeftOpen className="size-5" />
            </Button>
          </>
        )}
      </div>

      {/* Main nav */}
      <nav className={cn("flex-1 space-y-1", collapsed ? "px-2" : "px-3")}>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Separator */}
      <div className={cn(collapsed ? "px-2" : "px-3")}>
        <Separator className="my-2" />
      </div>

      {/* Bottom nav (Settings) */}
      <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar size="default">
              <AvatarFallback>OT</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">Ousmane Thienta</p>
              <p className="text-xs text-muted-foreground truncate">
                ousmane.thienta@audencia.com
              </p>
            </div>
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        )}
      </div>
    </aside>
  );
}
