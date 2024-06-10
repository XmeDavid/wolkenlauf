import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { projects } from "~/server/db/schema";
import { S3Client } from "~/server/aws";
import { createProject } from "~/server//db/queries/projects";
export async function POST(request:Request) {
    console.log('[INFO][API]: POST /new-project');
    try {
        const user = auth();
        if (!user ||typeof user.userId !== 'string'){
            throw new Error('Unauthorized');
        }

        const res = await createProject({
            name: "New Project",
            userId: user.userId
        })

        const project = res[0];
        if(!project){
            throw new Error('Project not created');
        }

        const projectFolder = `${user.userId}/${project.id}/`;
        await new S3Client().createFolderRecursively(projectFolder);

        return Response.json(project);
    } catch (error) {
        console.log('[ERROR][API]: POST /new-project (error)=>', error);
        return Response.error();
    }
}