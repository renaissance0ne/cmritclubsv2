"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClubsHeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: (filter: string) => void;
  searchQuery?: string;
  currentFilter?: string;
}

export function ClubsHeader({ 
  onSearch, 
  onFilter, 
  searchQuery = "", 
  currentFilter = "all" 
}: ClubsHeaderProps) {
  const filterOptions = [
    { value: "all", label: "All Departments" },
    { value: "cse", label: "Computer Science" },
    { value: "ece", label: "Electronics & Communication" },
    { value: "mech", label: "Mechanical" },
    { value: "civil", label: "Civil" },
    { value: "eee", label: "Electrical & Electronics" },
  ];

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clubs</h1>
        <p className="text-muted-foreground">
          View and manage all registered clubs
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-8"
            suppressHydrationWarning
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" suppressHydrationWarning>
              <Filter className="mr-2 h-4 w-4" />
              {filterOptions.find(opt => opt.value === currentFilter)?.label || "Filter"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilter?.(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
