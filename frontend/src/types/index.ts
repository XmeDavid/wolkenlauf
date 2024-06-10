export type File = {
    id: string;
    projectId: string;
    name: string;
    s3Url: string;
    relativePath: string;
    createdAt: string;
    updatedAt: string;
};

export type Project = {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    files: File[];
};


export type SideBarItem = {
    label: string;
    icon: JSX.Element;
    url?: string;
    project?: Project;
};

export interface ISidebarLink {
    icon: JSX.Element;
    label: string;
    url: string;
};

export interface ISidebarProject {
    icon: JSX.Element;
    label: string;
    project: Project;
};
