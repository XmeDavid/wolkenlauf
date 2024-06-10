
import { db } from "~/server/db";
import { projects, files } from "~/server/db/schema";
import { sql, eq } from "drizzle-orm";

export async function getProjects({ userId }: { userId: string }) {
    const dbQuery = db.select().from(projects).where(sql`${projects.userId} = ${userId}`);
    return dbQuery.execute();
};

export async function queryProjects({ userId, searchQuery }: { userId: string, searchQuery: string }) {
    const dbQuery = db.select().from(projects).where(sql`${projects.userId} = ${userId} AND lower(${projects.name}) LIKE lower(${`%${searchQuery}%`})`);
    return dbQuery.execute();
};

export async function getProjectsWithFiles({ userId }: { userId: string}) {
    const results = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      projectDescription: projects.description,
      projectCreatedAt: projects.createdAt,
      projectUpdatedAt: projects.updatedAt,
      fileId: files.id,
      fileName: files.name,
      fileS3Url: files.s3Url,
      fileRelativePath: files.relativePath,
      fileCreatedAt: files.createdAt,
      fileUpdatedAt: files.updatedAt,
    })
    .from(projects)
    .leftJoin(files, eq(projects.id, files.projectId));

  // Process the results to group files by projects
  const projectsMap = new Map();

  results.forEach((row) => {
    const project = {
      id: row.projectId,
      name: row.projectName,
      description: row.projectDescription,
      createdAt: row.projectCreatedAt,
      updatedAt: row.projectUpdatedAt,
      files: [],
    };

    if (!projectsMap.has(row.projectId)) {
      projectsMap.set(row.projectId, project);
    }

    if (row.fileId) {
      projectsMap.get(row.projectId).files.push({
        id: row.fileId,
        name: row.fileName,
        s3Url: row.fileS3Url,
        relativePath: row.fileRelativePath,
        createdAt: row.fileCreatedAt,
        updatedAt: row.fileUpdatedAt,
      });
    }
  });

  return Array.from(projectsMap.values());
};

export async function createProject(values: { name: string, userId: string }) {
  return db.insert(projects).values(values).returning();
};