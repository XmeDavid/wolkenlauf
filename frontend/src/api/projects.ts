import { Project } from "~/types";


export async function getProjects({ searchQuery }: { searchQuery?: string}) {
    const response = await fetch('/api/projects' + (searchQuery && searchQuery !== '' ? `?q=${searchQuery}`: ''));
    const data = await response.json();
    console.log('got data---', data);
    return data as Project[];
}

export function newProject() {
  fetch('/api/new-project', {
    method: 'POST'
  });
};

export async function getProjectsWithFiles(){
  const response = await fetch('/api/projects?files=true');
  const data = await response.json();
  return data as Project[];
}