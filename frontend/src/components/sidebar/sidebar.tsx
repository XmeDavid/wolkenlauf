import Link from "next/link";
import { PackageIcon, PlusIcon, SettingsIcon } from "~/components/icons";
import SidebarLink from "./sidebar-link";
export default function Component() {
  const items = [
    {
      icon: <PackageIcon className="h-5 w-5" />,
      label: "Projects",
      url: "/dashboard/projects"
    },
    {
      icon: <PlusIcon className="h-5 w-5" />,
      label: "Create Project",
      url: "/dashboard/projects/new"
    },
    {
      icon: <SettingsIcon className="h-5 w-5" />,
      label: "Settings",
      url: "/dashboard/settings"
    }
  ];
  return (
    <section className="grid min-h-screen lg:grid-cols-[246px_1fr]">
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {items.map((item, index) => (<SidebarLink key={index} {...item} />))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  )
}
