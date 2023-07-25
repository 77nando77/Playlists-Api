import z from 'zod'

export interface EditPlaylistInputDTO {
    token: string,
    name: string,
    idToEdit:string
}

export type EditplaylistOutputDTO = undefined

export const EditPlaylistSchema = z.object({
    token: z.string().min(1),
    name: z.string().min(1),
    idToEdit: z.string().min(1)
})