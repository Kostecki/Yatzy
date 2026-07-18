import { defineConfig } from "drizzle-kit";

const DB_PATH = process.env.DATABASE_PATH;
if (!DB_PATH) {
	throw new Error("DATABASE_PATH environment variable is not set");
}

export default defineConfig({
	out: "./src/db/drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: DB_PATH,
	},
});
