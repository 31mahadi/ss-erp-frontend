/**
 * Sidebar types and interfaces
 */
export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
  type: "module" | "submodule" | "feature";
}

export interface SidebarProps {
  className?: string;
}

