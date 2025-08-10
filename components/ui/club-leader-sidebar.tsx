"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  FolderOpen 
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

interface ClubLeaderSidebarProps {
  displayName: string;
  college: string;
}

export function ClubLeaderSidebar({ displayName, college }: ClubLeaderSidebarProps) {
  const pathname = usePathname();

  const basePath = `/${college}`;
  const dashboardPath = `${basePath}/dashboard`;

  const navigationItems = [
    {
      title: "Dashboard",
      href: dashboardPath,
      icon: LayoutDashboard,
      active: pathname === dashboardPath
    },
    {
      title: "Collections",
      href: `${basePath}/collections`,
      icon: FolderOpen,
      active: pathname.startsWith(`${basePath}/collections`)
    },
    {
      title: "Members",
      href: `${basePath}/members`,
      icon: Users,
      active: pathname.startsWith(`${basePath}/members`)
    },
    {
      title: "Events",
      href: `${basePath}/events`,
      icon: Calendar,
      active: pathname.startsWith(`${basePath}/events`),
      disabled: true // Future implementation
    },
    {
      title: "Reports",
      href: `${basePath}/reports`,
      icon: BarChart3,
      active: pathname.startsWith(`${basePath}/reports`),
      disabled: true // Future implementation
    },
    {
      title: "Settings",
      href: `${basePath}/settings`,
      icon: Settings,
      active: pathname.startsWith(`${basePath}/settings`),
      disabled: true // Future implementation
    }
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {displayName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">Club Leader</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                item.disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : item.active
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              onClick={item.disabled ? (e) => e.preventDefault() : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
              {item.disabled && (
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full ml-auto">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <SignOutButton>
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}
