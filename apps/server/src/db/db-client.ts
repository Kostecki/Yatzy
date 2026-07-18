import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.js";

const DB_PATH = process.env.DATABASE_PATH;
if (!DB_PATH) {
	throw new Error("DATABASE_PATH environment variable is not set");
}

const db = new Database(DB_PATH);

export const client = drizzle(db, { schema });
