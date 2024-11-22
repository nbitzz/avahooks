import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    appType: "custom",
    build: {
        target: ["es2022"],
        ssr: true,
        rollupOptions: {
            input: {
                index: join(__dirname, "src/index.ts"),
                readmeGenerator: join(__dirname, "src/tools/genReadme.ts"),
            },
        },
    },
})
