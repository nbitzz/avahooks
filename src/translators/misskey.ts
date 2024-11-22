import { z } from "zod"
import { translator } from "../lib/types.js"
import downloadAvatarForPayload from "../lib/downloadAvatarForPayload.js"
export default translator({
    query: z.object({
        instance: z
            .string()
            .describe("Link to your Misskey instance. Include protocol."),
        apiKey: z.string().describe("Misskey API key."),
    }),
    async execute(payload, { instance, apiKey }) {
        // unsure regarding supported image formats;
        // just to play it safe, prefer png then jpeg

        const avatar = await downloadAvatarForPayload(payload, [
            "png",
            "jpeg",
            undefined,
        ])

        if (!avatar) throw new Error("misskey: failed to get avatar")

        // create a new file in the drive

        const fd = new FormData()
        fd.append("file", avatar)

        let newFileRequest = await fetch(
            new URL("/api/drive/files/create", instance),
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
                body: fd,
                method: "POST",
            }
        )

        if (!newFileRequest.ok)
            throw new Error(
                `misskey: creating new file, got ${newFileRequest.status}`
            )

        const { id: avatarId }: { id: string } = await newFileRequest.json()

        // update the user avatar

        let updateRequest = await fetch(new URL("/api/i/update", instance), {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ avatarId }),
            method: "POST",
        })

        if (!updateRequest.ok)
            console.error(
                `misskey: updating avatar, got ${newFileRequest.status}`
            )
    },
})
