
import Link from "next/link"

import { FileIcon, SettingsIcon } from "~/components/icons"
import { ISidebarProject, SideBarItem } from "~/types"


export default function SidebarProject({ icon, label, project }: ISidebarProject) {
  const subItems: SideBarItem[] = [
    ...project.files.map((file) => ({
      label: file.name,
      icon: <FileIcon />,
      url: file.relativePath
    })),
    {
      label: 'Project Settings',
      icon: <SettingsIcon />,
      url: `/dashboard/projects/${project.id}/settings`
    }
  ];

  return (
    <Link
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
      href={`/dashboard/project/${project.id}`}
    >
      {icon}
      {label}
    </Link>
  )
};