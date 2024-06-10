import Link from "next/link"

import { SettingsIcon } from "~/components/icons"
import { ISidebarLink } from "~/types"


export default function SidebarLink({ icon, label, url }: ISidebarLink) {
  if(!url) return (<></>);
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