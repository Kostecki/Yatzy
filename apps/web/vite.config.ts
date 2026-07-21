import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: false,
			includeAssets: ["favicon/**/*"],
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
			},
		}),
	],
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
