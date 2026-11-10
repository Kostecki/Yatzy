import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Only the sources: tsc also compiles the tests into dist/
		include: ["src/**/*.test.ts"],
		env: {
			DATABASE_PATH: ":memory:",
		},
		setupFiles: ["./src/test-setup.ts"],
	},
});
