import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from "@vercel/postgres";
import { env } from "~/env";
import * as schema from "./schema";

export const db = drizzle(sql, { schema });