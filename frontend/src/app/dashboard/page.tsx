'use client';
import { Button } from "~/components/ui/button";
import SearchProject from "~/components/dashboard/search-project";
import ProjectTable from "~/components/dashboard/project-table";
import { useState } from "react";

import { newProject } from "~/api/projects";


export default function Dashboard() {

  const [search, setSearch] = useState<string>("");


  function handleSearch(string: string) {
    setSearch(string);
  };

  return (
    <section className="h-full w-full flex flex-col">
      <div className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
        <SearchProject onSearch={handleSearch}/>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">Projects</h1>
          <Button className="ml-auto" size="sm" onClick={newProject} >
            New Project
          </Button>
        </div>
        <div className="border shadow-sm rounded-lg">
          <ProjectTable searchQuery={search}></ProjectTable>
        </div>
      </div>
    </section>
  );
}
