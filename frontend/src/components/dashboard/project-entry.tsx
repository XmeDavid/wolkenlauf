"use client";
import { DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent, DropdownMenu } from "~/components/ui/dropdown-menu";
import { TableRow, TableCell } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { MoveHorizontalIcon } from "~/components/icons";
import Link from "next/link";
import { Project } from "~/types";

export interface ProjectRowProps {
    project: Project;
};

function formatDate(date: string) {
    const stringDate = new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    return (<span>{stringDate}</span>);
}

export default function ProjectRow({ project }: ProjectRowProps) {

    return (
        <TableRow>
            <TableCell className="font-medium">
                <Link className="hover:underline" href={`/dashboard/project/${project.id}`}>
                {project.name}
                </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">{ formatDate(project.updatedAt) }</TableCell>
            <TableCell className="hidden md:table-cell">12.3 MB</TableCell>
            <TableCell>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="rounded-full" size="icon" variant="ghost">
                    <MoveHorizontalIcon className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Open</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
            </TableRow>
    );
};