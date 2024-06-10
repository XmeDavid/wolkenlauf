import { auth } from "@clerk/nextjs/server";
import { getProjects, queryProjects, getProjectsWithFiles } from "~/server/db/queries/projects";

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
    console.log('[INFO][API]: GET /projects');
    try {
        const user = auth();
        if (!user ||typeof user.userId !== 'string'){
            throw new Error('Unauthorized');
        }

        const { searchParams } = new URL(req.url);
        const searchQuery = searchParams.get('q');
        const includeFiles = searchParams.get('files');

        if (includeFiles === 'true') {
            return Response.json(await getProjectsWithFiles({ userId: user.userId }));
        }

        if (searchQuery) {
            return Response.json(await queryProjects({ userId: user.userId, searchQuery }));
        }
        
        return Response.json(await getProjects({ userId: user.userId }));
    } catch (error) {
        console.log('[ERROR][API]: GET /projects (error)=>', error);
        return Response.error();
    }
};
