import { z } from "zod"
import { AvaRequest } from "./types.js"
import mime from "mime"

export default async function downloadAvatarForPayload(
    { id, host }: z.infer<typeof AvaRequest>,
    tryFmts: (string | undefined)[] = [undefined]
) {
    let endpoint = new URL(`/avatars/${id}/image`, host)
    let response = undefined,
        buf = undefined

    for (let fmt of tryFmts) {
        endpoint.searchParams.delete("format")
        if (fmt) endpoint.searchParams.append("format", fmt)

        response = await fetch(endpoint)
        if (response.ok) {
            buf = await response.arrayBuffer()
            break
        }
    }

    if (!buf || !response) return

    return new File(
        [buf],
        `${id}.${mime.getExtension(
            response.headers.get("content-type") || ""
        )}`,
        {
            type: response.headers.get("content-type") || "",
        }
    )
}
