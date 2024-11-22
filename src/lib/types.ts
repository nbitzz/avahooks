import { type AnyZodObject, z } from "zod"

export type Translator<T extends AnyZodObject> = {
    query: T
    execute(payload: z.infer<typeof AvaRequest>, query: z.infer<T>): void
}

// too tired to figure out a better solution
// i mean vite does the same thing right so
// at least i think
export function translator<T extends AnyZodObject>(tl: Translator<T>) {
    return tl
}

const AvaMetadata = z.object({
    altText: z.string().optional(),
    source: z.string().optional(),
    host: z.string(),
})

export const AvaRequest = z.discriminatedUnion("default", [
    AvaMetadata.extend({
        id: z.string().uuid(),
        default: z.literal(false),
    }),
    AvaMetadata.extend({
        id: z.literal("default"),
        default: z.literal(true),
    }),
])
