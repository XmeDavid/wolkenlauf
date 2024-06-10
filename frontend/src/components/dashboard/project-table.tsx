"use client";
import { TableHead, TableRow, TableHeader, TableBody, Table } from "~/components/ui/table";

import {
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import { getProjects } from "~/api/projects";
import ProjectRow from "./project-entry";

export interface ProjectTableProps {
    searchQuery?: string;
};

export default function ProjectTable({ searchQuery }: ProjectTableProps) {
    
    const { data: projects } = useQuery({
        queryKey: ['projects', searchQuery],
        queryFn: async() => getProjects({searchQuery})
    });

    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                { projects?.map((project) => (<ProjectRow project={project}/>))}
            </TableBody>
          </Table>
    );
};