import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Newspaper,
  FolderTree,
  Images,
  Users,
  UserPlus,
} from "lucide-react";

export type NavChild = { label: string; href: string };
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
};

export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Articles",
    href: "/admin/articles",
    icon: Newspaper,
    children: [
      { label: "All Articles", href: "/admin/articles" },
      { label: "Add New", href: "/admin/articles/new" },
    ],
  },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Media Library", href: "/admin/media", icon: Images },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Create User", href: "/admin/users/new", icon: UserPlus },
];
