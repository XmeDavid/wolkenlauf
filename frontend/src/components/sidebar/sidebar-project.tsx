import { FileIcon } from "lucide-react";
import Link from "next/link"

import { SettingsIcon } from "~/components/icons"
import { ISidebarLink, ISidebarProject, SideBarItem } from "~/types"
import SidebarLink from "./sidebar-link";
import { usePathname } from 'next/navigation';

export default function SidebarProject({ icon, label, project }: ISidebarProject) {
  
  const pathname = usePathname();
  const showSubItems = pathname.includes(`/dashboard/project/${project.id}`);

  const subItems: SideBarItem[] = project.files.map((file) => ({
    label: file.name,
    icon: <FileIcon />,
    url: file.relativePath
  }));

  subItems.push({
    label: "sub file",
    icon: <SettingsIcon />,
    url: `/dashboard/project/${project.id}/settings`
  } as SideBarItem);

  subItems.push({
    label: "sub file",
    icon: <SettingsIcon />,
    url: `/dashboard/project/${project.id}/settings`
  });

  console.log('---', pathname);

  return (
    <>
      <Link
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
        href={`/dashboard/project/${project.id}`}
      >
        {icon}
        {label}
      </Link>
      <ul className={`${showSubItems ? '' : 'h-0 '} overflow-hidden`}>
        {subItems.map((item) => (
          <li className="flex pl-4 group">
            <span className="pt-1 pl-1 text-gray-400 group-hover:text-gray-600">⌞</span>
            <SidebarLink {...item as ISidebarLink} />
          </li>
        ))}
        
      </ul>
    </>
  )
};