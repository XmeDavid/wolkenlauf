import Link from "next/link"

import { SettingsIcon } from "~/components/icons"

export interface SidebarLinkProps {
  label: string;
  icon: JSX.Element;
  url: string;
};
export default function SidebarLink({ icon, label, url }: SidebarLinkProps) {
  return (
    <Link
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      href={url}
    >
      {icon}
      {label}
    </Link>
  )
};