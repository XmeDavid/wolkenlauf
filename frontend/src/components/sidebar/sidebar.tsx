"use client";
import { Project, SideBarItem } from "~/types";
import SidebarItem from "./sidebar-item";
import { getProjectsWithFiles } from "~/api/projects";
import { PackageIcon, SettingsIcon } from "~/components/icons";
import {
  useQuery,
} from '@tanstack/react-query'

async function  getSideBarItems(): Promise<SideBarItem[]>{
  const projects = await getProjectsWithFiles();

  return [
    ...(projects).map((project) => ({
      label: project.name,
      icon: <PackageIcon />,
      project: project
    })),
    {
      label: 'Global Settings',
      icon: <SettingsIcon />,
      url: '/dashboard/settings'
    }
  ];

};

export default function Component() {

  const { data: sidebarItems } = useQuery({
    queryKey: ['allProjects'],
    queryFn: async() => getSideBarItems()
  });


  return (
    <section className="grid min-h-screen lg:grid-cols-[246px_1fr]">
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {sidebarItems?.map((item, index) => (<SidebarItem key={index} {...item} />))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  )
}
