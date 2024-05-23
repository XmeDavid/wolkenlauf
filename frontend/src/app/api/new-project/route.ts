import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { projects } from "~/server/db/schema";

export async function POST(request:Request) {
    const user = auth();
    if (!user ||typeof user.userId !== 'string'){
        return Response.error();
    }
    const res = await db.insert(projects).values({
        name: "New Project",
        userId: user.userId
    }).returning();
    return Response.json(res);
}