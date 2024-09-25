import { ISidebarLink, ISidebarProject, SideBarItem } from "~/types";
import SidebarLink from "./sidebar-link";
import SidebarProject from "./sidebar-project";

export default function SidebarItem(item: SideBarItem) {
    if (item.project !== undefined) {
        return (
            <SidebarProject {...item as ISidebarProject} />
        );
    }
    if (item.url && typeof item.url === 'string') {
        return (
            <SidebarLink {...item as ISidebarLink} />
        );
    }
    return (<></>);
};