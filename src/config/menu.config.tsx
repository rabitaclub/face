import { MessageSquare, User, Search, Home, Users, UserPlus } from "lucide-react";

export interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badgeKey?: string;
}

export const NavItems: NavItem[] = [
  {
    icon: <Home size={18} />,
    label: "Home",
    href: "/",
  },
  // {
  //   icon: <UserPlus size={18} />,
  //   label: "Connect",
  //   href: "/connect",
  // },
  {
    icon: <MessageSquare size={18} />,
    label: "Messages",
    href: "/messages",
    badgeKey: "messages",
  },
  {
    icon: <User size={18} />,
    label: "Profile",
    href: "/profile",
  },
];