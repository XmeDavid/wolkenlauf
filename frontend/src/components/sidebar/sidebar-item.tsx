import { ISidebarLink, ISidebarProject, SideBarItem } from "~/types";
import SidebarLink from "./sidebar-link";
import SidebarProject from "./sidebar-project";

export default function SidebarItem(item: SideBarItem) {
    return (
        <>
            {item.project ? <SidebarProject {...item as ISidebarProject} /> : <></> }
            {item.url && typeof item.url === 'string' ? <SidebarLink {...item as ISidebarLink} /> : <></> }
        </>
    );
};