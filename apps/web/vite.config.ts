import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			$lib: path.resolve("./src/lib"),
		},
	},
	server: {
		proxy: {
			"/trpc": {
				target: "http://localhost:3000",
				ws: true,
			},
		},
	},
});
