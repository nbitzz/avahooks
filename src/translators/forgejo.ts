import { z } from "zod"
import { translator } from "../lib/types.js"
import downloadAvatarForPayload from "../lib/downloadAvatarForPayload.js"
export default translator({
    query: z.object({
        instance: z
            .string()
            .describe("Link to your Forgejo instance. Include protocol."),
        apiKey: z.string().describe("Forgejo API key."),
    }),
    async execute(payload, { instance, apiKey }) {
        const avatar = await downloadAvatarForPayload(payload, [
            "png",
            "jpeg",
            "webp",
            "gif",
            undefined,
        ])

        if (!avatar) throw new Error("forgejo: failed to get avatar")

        // update the user avatar

        let updateRequest = await fetch(
            new URL("/api/v1/user/avatar", instance),
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: Buffer.from(await avatar.arrayBuffer()).toString(
                        "base64"
                    ),
                }),
                method: "POST",
            }
        )

        if (!updateRequest.ok)
            console.error(
                `forgejo: updating avatar, got ${updateRequest.status}`
            )
    },
})
