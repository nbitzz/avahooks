import type { AnyZodObject, SomeZodObject } from "zod"
import type { Translator } from "../lib/types.js"
import base from "./base.md?raw"

console.log(
    base.replace(
        "<!--Generated output-->",
        (
            await Promise.all(
                Object.entries(await import.meta.glob("../translators/*")).map(
                    async ([fileName, exports]) => {
                        const name = fileName.match(
                            /\.\.\/translators\/(.*)\.ts/
                        )![1]
                        const translator = (
                            (await exports()) as {
                                default: Translator<SomeZodObject>
                            }
                        ).default

                        return `### \`/${name}\`\n\n${Object.entries(
                            translator.query.shape
                        )
                            .map(
                                ([key, zobj]) =>
                                    `- \`${key}\`${
                                        zobj.isOptional() ? ` (optional)` : ""
                                    }: ${
                                        zobj.description || "*No description*"
                                    }`
                            )
                            .join("\n")}`
                    }
                )
            )
        ).join("\n\n")
    )
)
