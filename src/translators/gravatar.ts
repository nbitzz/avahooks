import { z } from "zod"
import { translator } from "../lib/types.js"
import downloadAvatarForPayload from "../lib/downloadAvatarForPayload.js"
export default translator({
    query: z.object({
        cookie: z.string().describe("Your `gravatar` cookie."),
    }),
    async execute(payload, { cookie }) {
        // unsure regarding supported image formats;
        // just to play it safe, prefer png then jpeg

        const avatar = await downloadAvatarForPayload(payload, [
            "png",
            "jpeg",
            undefined,
        ])

        if (!avatar) throw new Error("gravatar: failed to get avatar")

        const Cookie = `gravatar=${encodeURIComponent(cookie)}; is-logged-in=1`

        // construct fd
        const fd = new FormData()
        fd.append("image", avatar)
        fd.append("source", "direct")
        fd.append("forceIdentity", "false")

        // upload the avatar

        const uploadResult = await fetch(
            "https://api.gravatar.com/v2/users/me/image",
            {
                body: fd,
                method: "POST",
                headers: { Cookie },
            }
        )

        if (!uploadResult.ok)
            throw new Error(
                `gravatar: upload failed with ${uploadResult.status}`
            )

        const {
            email_hash,
            image_id,
        }: { email_hash: string; image_id: string } = await uploadResult.json()

        // set its alt text

        if (payload.altText) {
            let req = await fetch(
                `https://api.gravatar.com/v2/users/me/image/${image_id}`,
                {
                    method: "POST",
                    body: JSON.stringify({ altText: payload.altText }),
                    headers: { Cookie },
                }
            )
            if (!req.ok)
                console.warn(`gravatar: alt text set failed with ${req.status}`)
        }

        // set it as user avatar

        const setUserAvatarResult = await fetch(
            `/v2/users/me/identity/${email_hash}`,
            {
                method: "POST",
                body: JSON.stringify({ image_id }),
                headers: { Cookie },
            }
        )

        if (!setUserAvatarResult.ok)
            throw new Error(
                `gravatar: set user avatar failed with ${setUserAvatarResult.status}`
            )
    },
})
