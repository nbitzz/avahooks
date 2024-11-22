import { Hono } from "hono"
import { type HttpBindings, serve } from "@hono/node-server"
import getDevServerMiddleware from "./lib/viteMiddleware.js"
import { AvaRequest, Translator } from "./lib/types.js"
import { AnyZodObject } from "zod"

const app = new Hono<{ Bindings: HttpBindings }>()

// TODO: fix dev server
/*
if (process.env.NODE_ENV !== "production")
    app.use(await getDevServerMiddleware())
*/

// add all translators

let translators = await Promise.all(
    Object.entries(await import.meta.glob("./translators/*")).map(
        async ([fileName, exports]) =>
            [
                fileName.match(/\.\/translators\/(.*)\.ts/)![1],
                ((await exports()) as { default: Translator<any> }).default,
            ] as [string, Translator<AnyZodObject>]
    )
)

translators.forEach(([name, translator]) => {
    app.post(name, async c => {
        // ensure the payload is valid
        let avaRequest = AvaRequest.safeParse(await c.req.json())

        if (!avaRequest.success) {
            c.status(400)
            return c.body(avaRequest.error.toString())
        }

        // ensure the qstring works
        let query = translator.query.safeParse(c.req.query())

        if (!query.success) {
            c.status(400)
            return c.body(query.error.toString())
        }

        await translator.execute(avaRequest.data, query.data)
        return c.body(null)
    })
})

app.get("/", c => c.redirect(`https://git.sucks.win/split/avahooks`))

serve({
    fetch: app.fetch,
    port: parseInt(process.env.PORT || "3000", 10) || 3000,
})
