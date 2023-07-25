import z from 'zod'

export interface likeOrDislikePlaylistInputDTO {
    token: string,
    playlistId: string,
    likes: boolean
}

export type likeOrDislikePlaylistOutputDTO = undefined

export const lokeOrDislikePlaylistSchema = z.object({
    token: z.string().min(1),
    playlistId: z.string().min(1),
    likes: z.boolean()
})