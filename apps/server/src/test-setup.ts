import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { client } from "./db/db-client.js";

migrate(client, { migrationsFolder: "./src/db/drizzle" });

await import("./db/seed.js");
