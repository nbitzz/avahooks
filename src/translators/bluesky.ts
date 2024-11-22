import { z } from "zod"
import { translator } from "../lib/types.js"
import downloadAvatarForPayload from "../lib/downloadAvatarForPayload.js"

async function xrpc(
    pds: string,
    token: string | undefined,
    method: "GET" | "POST",
    action: string,
    payload?: Record<any, any>
) {
    let endpoint = new URL(`/xrpc/${action}`, pds)

    // use payload as search params if get
    if (payload && method == "GET")
        Object.entries(payload).forEach(([name, value]) =>
            endpoint.searchParams.append(name, value)
        )

    let request = await fetch(endpoint, {
        // use payload as body if post
        ...(payload && method == "POST"
            ? {
                  body:
                      payload instanceof Blob
                          ? payload
                          : JSON.stringify(payload),
              }
            : {}),
        headers: {
            ...(payload && method == "POST"
                ? {
                      "Content-Type":
                          payload instanceof Blob
                              ? payload.type
                              : "application/json",
                  }
                : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method,
    })

    if (!request.ok)
        throw new Error(`bsky: ${action} failed with ${request.status}`)

    return request.json()
}

export default translator({
    query: z.object({
        pds: z
            .string()
            .default("https://bsky.app")
            .describe("Bluesky PDS. Include protocol."),
        identifier: z.string().describe("Bluesky handle"),
        password: z
            .string()
            .describe("Bluesky password - create an app password in settings"),
    }),
    async execute(payload, { pds, identifier, password }) {
        // bind unauthenticated xrpc function
        const uaxrpc = xrpc.bind(null, pds, undefined)

        // login to bluesky
        const { accessJwt, did }: { accessJwt: string; did: string } =
            await uaxrpc("POST", "/xrpc/com.atproto.server.createSession", {
                identifier,
                password,
            })

        // download avatar
        // unsure of supported image types on bsky so let's do png, jpeg
        const avatar = await downloadAvatarForPayload(payload, [
            "png",
            "jpeg",
            undefined,
        ])

        if (!avatar) throw new Error(`bsky: failed to get avatar`)

        // bind new authenticated xrpc function
        const axrpc = xrpc.bind(null, pds, accessJwt)

        // upload an avatar to bluesky
        let { blob } = await axrpc(
            "POST",
            "com.atproto.repo.uploadBlob",
            avatar
        )

        // get the current profile
        let { value: profile, cid } = await axrpc(
            "GET",
            "com.atproto.repo.getRecord",
            {
                repo: did,
                collection: "app.bsky.actor.profile",
                rkey: "self",
            }
        )

        // set its avatar
        profile.avatar = blob

        // looking at the sdk source code for this; just in case
        profile.$type = "app.bsky.actor.profile"

        // update the current profile
        await axrpc("POST", "com.atproto.repo.putRecord", {
            repo: did,
            collection: "app.bsky.actor.profile",
            rkey: "self",
            record: profile,
            swapRecord: cid || null,
        })
    },
})
