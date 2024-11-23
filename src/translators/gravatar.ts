import { z } from "zod"
import { translator } from "../lib/types.js"
import downloadAvatarForPayload from "../lib/downloadAvatarForPayload.js"
import crypto from "node:crypto"
export default translator({
    query: z.object({
        cookie: z.string().describe("Your `gravatar` cookie."),
        email: z
            .string()
            .optional()
            .describe("Email to set the profile picture for."),
    }),
    async execute(payload, { cookie, email }) {
        // unsure regarding supported image formats;
        // just to play it safe, prefer png then jpeg

        const avatar = await downloadAvatarForPayload(payload, [
            "png",
            "jpeg",
            undefined,
        ])

        if (!avatar) throw new Error("gravatar: failed to get avatar")

        let headers: Record<string, string> = {
            Cookie: `gravatar=${encodeURIComponent(cookie)}; is-logged-in=1`,
            "Alt-Used": "api.gravatar.com",
            Origin: "https://gravatar.com",
            Referer: "https://gravatar.com/",
        }

        // get X-GR-Nonce

        const nonceRequest = await fetch(
            "https://gravatar.com/profile/avatars",
            { headers }
        )

        if (!nonceRequest.ok)
            throw new Error(
                `gravatar: failed to get site to extract nonce with ${nonceRequest.status}`
            )

        // this is dumb, but idrgaf
        const nonce = (await nonceRequest.text()).match(
            /data-rest-api-nonce="(.*)"/
        )?.[1]

        if (!nonce) throw new Error(`gravatar: failed to scrape nonce`)

        headers["X-GR-Nonce"] = nonce

        // construct fd
        const fd = new FormData()
        fd.append("image", avatar)
        fd.append("source", "direct")
        fd.append("forceIdentity", "false")

        // upload the avatar

        const uploadResult = await fetch(
            "https://api.gravatar.com/v2/users/me/image?_locale=&source=web-app-editor",
            {
                body: fd,
                method: "POST",
                headers,
            }
        )

        if (!uploadResult.ok)
            throw new Error(
                `gravatar: upload failed with ${uploadResult.status}`
            )

        const uprRes: { email_hash: string; image_id: string } =
                await uploadResult.json(),
            { image_id } = uprRes,
            email_hash = email
                ? crypto
                      .createHash("md5")
                      .update(email.toLowerCase())
                      .digest("hex")
                : uprRes.email_hash

        // set its alt text

        if (payload.altText) {
            let req = await fetch(
                `https://api.gravatar.com/v2/users/me/image/${image_id}?_locale=&source=web-app-editor`,
                {
                    method: "POST",
                    body: JSON.stringify({ altText: payload.altText }),
                    headers,
                }
            )
            if (!req.ok)
                console.warn(`gravatar: alt text set failed with ${req.status}`)
        }

        // set it as user avatar

        const setUserAvatarResult = await fetch(
            `https://api.gravatar.com/v2/users/me/identity/${email_hash}?_locale=&source=web-app-editor`,
            {
                method: "POST",
                body: JSON.stringify({ image_id }),
                headers,
            }
        )

        if (!setUserAvatarResult.ok)
            throw new Error(
                `gravatar: set user avatar failed with ${setUserAvatarResult.status}`
            )
    },
})
