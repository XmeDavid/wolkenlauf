"use client";

export interface ProjectViewProps {
    params: {
        id: string;
    };
};

export default function ProjectView({
    params: { id },
}: ProjectViewProps){

    return (
        <section className="flex flex-col w-full">
            this is a project view! { id}
        </section>
    );
};