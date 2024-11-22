import { HttpBindings } from "@hono/node-server"
import { MiddlewareHandler } from "hono"

export default async function getDevServerMiddleware() {
    const { createServer } = await import("vite")

    const vite = await createServer({
        appType: "custom",
        server: { middlewareMode: true },
    })

    const middleware: MiddlewareHandler<{ Bindings: HttpBindings }> = (
        c,
        next
    ) =>
        new Promise<Awaited<ReturnType<typeof next>>>(res =>
            vite.middlewares(c.env.incoming, c.env.outgoing, async () =>
                res(await next())
            )
        )

    return middleware
}
