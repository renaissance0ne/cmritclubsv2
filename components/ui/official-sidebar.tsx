"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Mail,
  Building2
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

interface OfficialSidebarProps {
  officialRole: string;
  displayName: string;
  department?: string;
}

export function OfficialSidebar({ officialRole, displayName, department }: OfficialSidebarProps) {
  const pathname = usePathname();

  // Generate base paths based on role type
  const isHOD = officialRole.includes('_hod');
  const college = 'cmrit'; // Default college - could be made dynamic later
  
  const basePath = isHOD 
    ? `/${college}/hod/${officialRole}`
    : `/${college}/official/${officialRole}`;

  const dashboardPath = `${basePath}/dashboard`;
  const applicationsPath = `${basePath}/club-applications`;
  const lettersPath = `${basePath}/letters`;
  const clubsPath = `${basePath}/clubs`;

  const navigationItems = [
    {
      title: "Dashboard",
      href: dashboardPath,
      icon: LayoutDashboard,
      active: pathname === dashboardPath
    },
    {
      title: "Club Applications",
      href: applicationsPath,
      icon: FileText,
      active: pathname.startsWith(applicationsPath)
    },
    {
      title: "Clubs",
      href: clubsPath,
      icon: Building2,
      active: pathname.startsWith(clubsPath)
    },
    {
      title: "Letters",
      href: lettersPath,
      icon: Mail,
      active: pathname.startsWith(lettersPath)
    }
  ];

  // Format role display name
  const formatRoleDisplay = (role: string) => {
    if (role.includes('_hod')) {
      const dept = role.replace('_hod', '').toUpperCase();
      return `${dept} HOD`;
    }
    return role.toUpperCase();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {displayName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{formatRoleDisplay(officialRole)}</p>
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
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                item.active
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <SignOutButton>
          <Button variant="ghost" className="w-full justify-start" suppressHydrationWarning>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}
