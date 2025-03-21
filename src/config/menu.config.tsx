import { MessageSquare, User, Search, Home } from "lucide-react";

export interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
}

export const NavItems: NavItem[] = [
  {
    icon: <Home size={18} />,
    label: "Home",
    href: "/",
  },
  {
    icon: <MessageSquare size={18} />,
    label: "Messages",
    href: "/messages",
  },
  {
    icon: <User size={18} />,
    label: "Profile",
    href: "/profile",
  },
];