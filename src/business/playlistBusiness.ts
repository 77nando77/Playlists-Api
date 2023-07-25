import { PlaylistDatabase } from "../database/PlaylistDatabase";
import { CreatePlaylistInputDTO, CreatePlaylistOutputDTO } from "../dtos/playlist/createPlaylist.dto";
import { DeletePlaylistInputDTO, DeletePlaylistOutputDTO } from "../dtos/playlist/deletePlaylist.dto";
import { EditPlaylistInputDTO, EditplaylistOutputDTO } from "../dtos/playlist/editPlaylist.dto";
import { GetPlaylistsInputDTO, GetPlaylistsOutputDTO } from "../dtos/playlist/getPlaylists.dto";
import { likeOrDislikePlaylistInputDTO, likeOrDislikePlaylistOutputDTO } from "../dtos/playlist/likeOrDislikePlaylist.dto.ts";
import { ForbiddenError } from "../errors/ForbiddenError";
import { NotFoundError } from "../errors/NotFoundError";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { LikeDislikeDB, PLAYLIST_LIKE, Playlist } from "../models/Playlist";
import { USER_ROLES } from "../models/User";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";

export class PlaylistBusiness {
    constructor(
        private playlistDatabase: PlaylistDatabase,
        private idGeneretor: IdGenerator,
        private tokenManager: TokenManager
    ) { }

    public createPlaylist = async (input: CreatePlaylistInputDTO): Promise<CreatePlaylistOutputDTO> => {
        const { name, token } = input
        const id = this.idGeneretor.generate()

        const payload = this.tokenManager.getPayload(token)

        if (!payload) {
            throw new UnauthorizedError()
        }

        const playlist = new Playlist(
            id,
            name,
            0,
            0,
            new Date().toISOString(),
            new Date().toISOString(),
            payload.id,
            payload.name
        )

        const playlistDB = playlist.toDBModel()
        await this.playlistDatabase.insertPlaylist(playlistDB)

        const output: CreatePlaylistOutputDTO = undefined

        return output
    }

    public getPlaylists = async (input: GetPlaylistsInputDTO): Promise<GetPlaylistsOutputDTO> => {
        const { token } = input

        const payload = this.tokenManager.getPayload(token)

        if (!payload) {
            throw new UnauthorizedError()
        }

        const playlistsDBAndCreatorName = await this.playlistDatabase.getPlaylistsAndCreatorName()

        const playlists = playlistsDBAndCreatorName.map((playlistAndCreatorName) => {
            const playlist = new Playlist(
                playlistAndCreatorName.id,
                playlistAndCreatorName.name,
                playlistAndCreatorName.likes,
                playlistAndCreatorName.dislikes,
                playlistAndCreatorName.created_at,
                playlistAndCreatorName.updated_at,
                playlistAndCreatorName.creator_id,
                playlistAndCreatorName.creator_name
            )

            return playlist.toBusinessModel()
        })

        const output: GetPlaylistsOutputDTO = playlists

        return output
    }

    public editPlaylist = async (input: EditPlaylistInputDTO): Promise<EditplaylistOutputDTO> => {
        const { token, name, idToEdit } = input

        const payload = this.tokenManager.getPayload(token)

        if (!payload) {
            throw new UnauthorizedError()
        }

        const playlistDB = await this.playlistDatabase.findPlaylistById(idToEdit)

        if (!playlistDB) {
            throw new NotFoundError("não há playlist com essa id")
        }

        if (payload.id !== playlistDB.creator_id) {
            throw new ForbiddenError("essa playlist so pode ser editada pela pessoa que criou")
        }

        const playlist = new Playlist(
            playlistDB.id,
            playlistDB.name,
            playlistDB.likes,
            playlistDB.dislikes,
            playlistDB.created_at,
            playlistDB.updated_at,
            playlistDB.creator_id,
            payload.name
        )

        playlist.setName(name)

        const updatedPlaylistDB = playlist.toDBModel()

        await this.playlistDatabase.updatePlaylist(updatedPlaylistDB)

        const output: EditplaylistOutputDTO = undefined

        return output
    }

    public deletePlaylist = async (input: DeletePlaylistInputDTO): Promise<DeletePlaylistOutputDTO> => {
        const { token, idToDelete } = input

        const payload = this.tokenManager.getPayload(token)

        if (!payload) {
            throw new UnauthorizedError()
        }

        const playlistDB = await this.playlistDatabase.findPlaylistById(idToDelete)

        if (!playlistDB) {
            throw new NotFoundError("não há playlist com essa id")
        }

        if (payload.role !== USER_ROLES.ADMIN) {
            if (payload.id !== playlistDB.creator_id) {
                throw new ForbiddenError("essa playlist so pode ser deletada pela pessoa que criou ou um admin")
            }
        }

        await this.playlistDatabase.deletePlaylistById(idToDelete)

        const output: DeletePlaylistOutputDTO = undefined

        return output


    }

    public likeOrDislikePlaylist = async (input: likeOrDislikePlaylistInputDTO): Promise<likeOrDislikePlaylistOutputDTO> => {
        const { token, playlistId, likes} = input
        
        const payload = this.tokenManager.getPayload(token)

        if(!payload){
            throw new UnauthorizedError()
        }

        const playlistDBWithCreatorName = await this.playlistDatabase.findPlaylistWithCreatorNameById(playlistId)

        if(!playlistDBWithCreatorName){
            throw new NotFoundError("Playlist com essa id não existe")
        }

        const playlist = new Playlist(
            playlistDBWithCreatorName.id,
            playlistDBWithCreatorName.name,
            playlistDBWithCreatorName.likes,
            playlistDBWithCreatorName.dislikes,
            playlistDBWithCreatorName.created_at,
            playlistDBWithCreatorName.updated_at,
            playlistDBWithCreatorName.creator_id,
            playlistDBWithCreatorName.creator_name
        )
        
        const likeSQLite = likes ? 1 : 0

        const likeDislikeDB: LikeDislikeDB = {
            user_id: payload.id,
            playlist_id: playlistId,
            likes: likeSQLite
        } 

        const likeDislikeExists = await this.playlistDatabase.findLikeDislike(likeDislikeDB)

        if(likeDislikeExists === PLAYLIST_LIKE.ALREADY_LIKED){
            if(likes){
                await this.playlistDatabase.removeLikeDislike(likeDislikeDB)
                playlist.removeLike()
            }else{
                await this.playlistDatabase.updateLikeDislike(likeDislikeDB)
                playlist.removeLike()
                playlist.addDisLike
            }
        } else if (likeDislikeExists === PLAYLIST_LIKE.ALREADY_DISLIKED){
            if(likes === false){
                await this.playlistDatabase.removeLikeDislike(likeDislikeDB)
                playlist.removeDislike()
            }else {
                await this.playlistDatabase.updateLikeDislike(likeDislikeDB)
                playlist.removeDislike()
                playlist.addLike()
            }
        } else {
            await this.playlistDatabase.insertLikeDislike(likeDislikeDB)
            likes? playlist.addLike() : playlist.addDisLike()
        }

        const updatedPlaylistDB = playlist.toDBModel()

        await this.playlistDatabase.updatePlaylist(updatedPlaylistDB)

        const output: likeOrDislikePlaylistOutputDTO = undefined

        return output
    }
}