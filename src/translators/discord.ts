import { z } from "zod"
import { translator } from "../lib/types.js"
import downloadAvatarForPayload from "../lib/downloadAvatarForPayload.js"
export default translator({
    query: z.object({ token: z.string().describe("Discord token") }),
    async execute(payload, { token }) {
        let avatar = await downloadAvatarForPayload(payload, [
            "png",
            "jpeg",
            undefined,
        ])

        if (!avatar) throw new Error("discord: failed to get avatar")

        const browser_version = "113.0.5666.197",
            browser_version_short = browser_version.split(".")[1],
            client_build_number = 347115, // todo: figure out how to get this?
            ua = `Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser_version} Safari/537.36`

        // copied from a firefox private browsing window
        // realistically this will probably need updates in the future
        // but for now this is good enough
        let f = await fetch("https://discord.com/api/v9/users/@me", {
            headers: {
                "User-Agent": ua,
                Accept: "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type": "application/json",
                Authorization: token,
                "X-Super-Properties": Buffer.from(
                    JSON.stringify({
                        os: "Windows",
                        browser: "Chrome",
                        device: "",
                        system_locale: "en-US",
                        browser_user_agent: ua,
                        browser_version,
                        os_version: "10",
                        referrer: "",
                        referring_domain: "",
                        referrer_current: "",
                        referring_domain_current: "",
                        release_channel: "stable",
                        client_build_number,
                        client_event_source: null,
                    })
                ).toString("base64"),
                "X-Discord-Locale": "en-US",
                "X-Discord-Timezone": "America/Los_Angeles",
                "X-Debug-Options": "bugReporterEnabled",
                "Sec-GPC": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "sec-ch-ua-platform": '"Windows"',
                "sec-ch-ua": `"Google Chrome";v="${browser_version_short}", "Chromium";v="${browser_version_short}", "Not=A?Brand";v="24"`,
                "sec-ch-ua-mobile": "?0",
                Priority: "u=0",
                Referer: "https://discord.com/channels/@me/",
                Origin: "https://discord.com",
            },
            body: JSON.stringify({
                avatar: `data:${avatar.type};base64,${Buffer.from(
                    await avatar.arrayBuffer()
                ).toString("base64")}`,
            }),
            method: "PATCH",
        })

        if (!f.ok)
            throw new Error(
                `discord: avatar set failed with ${f.status}: ${await f.text()}`
            )
    },
})
