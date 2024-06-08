import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { projects } from "~/server/db/schema";
import { S3Client } from "~/server/aws";

export async function POST(request:Request) {
    console.log('[INFO][API]: POST /new-project');
    try {
        const user = auth();
        if (!user ||typeof user.userId !== 'string'){
            throw new Error('Unauthorized');
        }

        const res = await db.insert(projects).values({
            name: "New Project",
            userId: user.userId
        }).returning();

        const project = res[0];
        if(!project){
            throw new Error('Project not created');
        }

        const s3 = new S3Client();

        const projectFolder = `${user.userId}/${project.id}/`;
        await s3.createFolderRecursively(projectFolder);

        return Response.json(project);
    } catch (error) {
        console.log('[ERROR][API]: POST /new-project (error)=>', error);
        return Response.error();
    }
}