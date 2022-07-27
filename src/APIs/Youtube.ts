import { VideoRecord, YoutubeAPIResult, YoutubePlaylist, YoutubePlaylistItem } from "@types"
import axios from "axios"
import { Collection } from "discord.js"
import { db } from "../firebase"
import { youtubeKey } from "../config"

export default class Youtube {
  private key: string
  private youtubeDefaults: YoutubeInfo = {
    guildId: "default",
    channelId: "UCGyh9ICzUcKVpx7SDP9ZmwQ",
    playlistTitles: ["Olympus", "Denali", "Kilauea", "Everest"],
  }

  private youtubeInfo: YoutubeInfo

  private choicesCollection = new Collection<string, Choices>()

  constructor(youtubeInfo?: YoutubeInfo) {
    this.key = youtubeKey
    this.youtubeInfo = youtubeInfo ? youtubeInfo : this.youtubeDefaults
  }

  public async getYoutubeVideos() {
    const playlists = await this.fetchPlaylists()
    const videos = await this.fetchVideos(playlists)
    const records = this.transformVideos(videos, playlists)
    this.upsertOptions(records)
    const results = await this.upsertVideos(records)
    return results.length
  }

  public getChoices(guildId?: string) {
    if (guildId && this.choicesCollection.has(guildId)) {
      return this.choicesCollection.get(guildId)
    }

    return this.choicesCollection.get('default')
  }

  private async fetchPlaylists() {
    // Get playlists...
    const playlists = await this.getYoutubeResults<YoutubePlaylist>({
      key: this.key,
      endPoint: "playlists",
      channelId: this.youtubeInfo.channelId,
      part: "snippet",
      maxResults: 50,
    })

    return playlists.filter((playlist) => this.youtubeInfo.playlistTitles.includes(playlist.snippet.title))
  }

  private async fetchVideos(playlists: YoutubePlaylist[]) {
    console.log(`Getting Videos from Youtube...`)

    // Get videos in playlists...
    const unflatVideos = await Promise.all(
      playlists.map(async (playlist) => {
        return await this.getYoutubeResults<YoutubePlaylistItem>({
          key: this.key,
          endPoint: "playlistItems",
          playlistId: playlist.id,
          part: "snippet",
          maxResults: 50,
        })
      })
    )

    // Flatten and filter deleted vides...
    return unflatVideos.flat().filter((video) => video.snippet.title !== "Deleted video")
  }

  private async getYoutubeResults<TResult>(options: YoutubeApiOptions, prevPage?: YoutubeAPIResult<TResult>): Promise<TResult[]> {
    let url = this.getYoutubeEndpoint(options)

    if (prevPage?.nextPageToken) {
      url += `&pageToken=${prevPage?.nextPageToken}`
    }

    const data: YoutubeAPIResult<TResult> = (await axios(url)).data

    if (prevPage) {
      data.items = [...prevPage.items, ...data.items]
    }

    if (data.nextPageToken) {
      return this.getYoutubeResults(options, data)
    } else {
      return data.items
    }
  }

  private transformVideos(videos: YoutubePlaylistItem[], playlists: YoutubePlaylist[]) {
    const expressions = [/(?<=Target:).+/, /(?<=Primary:).+/, /(?<=Secondary:).+/, /(?<=Equipment:).+/]
    return videos.map((video) => {
      const { snippet } = video
      const { playlistId, position, videoOwnerChannelTitle, videoOwnerChannelId, resourceId, ...record } = snippet
      const [title, modification] = snippet.title.split(" - ").map((item) => item.trim())
      const { snippet: plSnippet } = playlists.find((playlist) => playlist.id === snippet.playlistId)!
      const [muscleGroups, primaryMuscles, secondaryMuscles, equipment] = expressions.map((expression) => {
        const matched = snippet.description.match(expression)
        return matched ? matched[0].trim().split(", ") : []
      })
      return {
        ...record,
        title,
        modification,
        program: plSnippet.title,
        videoId: resourceId?.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${resourceId?.videoId}`,
        muscleGroups,
        primaryMuscles,
        secondaryMuscles,
        equipment,
        musclesEquipment: [...muscleGroups, ...primaryMuscles, ...equipment],
      } as VideoRecord
    })
  }

  private async upsertVideos(videos: VideoRecord[]) {
    const videosRef = db.collection("videos")
    const oldVideos = await videosRef.listDocuments()

    oldVideos.forEach(async (video) => {
      await video.delete()
    })

    return await Promise.all(
      videos.map(async (video) => {
        return await videosRef.add(video)
      })
    )
  }

  private async upsertOptions(records: VideoRecord[]) {
    const { muscleGroups, primaryMuscles, equipment } = records.reduce(
      (prev, { muscleGroups, primaryMuscles, equipment }, index) => {
        return {
          muscleGroups: [...prev.muscleGroups, ...muscleGroups],
          primaryMuscles: [...prev.primaryMuscles, ...primaryMuscles],
          equipment: [...prev.equipment, ...equipment],
        }
      },
      {
        muscleGroups: [""],
        primaryMuscles: [""],
        equipment: [""],
      }
    )

    const optionsRef = db.collection('commandOptions')
    await optionsRef.doc(this.youtubeInfo.guildId).set({
      muscleGroups: this.buildChoicesArray(muscleGroups),
      primaryMuscles: this.buildChoicesArray(primaryMuscles),
      equipments: this.buildChoicesArray(equipment)
    })
  }

  private getYoutubeEndpoint(options: YoutubeApiOptions): string {
    const baseUrl = "https://www.googleapis.com/youtube/v3/"
    let url = `${baseUrl}${options.endPoint}?&key=${youtubeKey}`
    url += options.channelId ? `&channelId=${options.channelId}` : ``
    url += options.playlistId ? `&playlistId=${options.playlistId}` : ``
    url += options.part ? `&part=${options.part}` : ``
    url += options.maxResults ? `&maxResults=${options.maxResults}` : ``
    return url
  }

  private buildChoicesArray(values: string[]) {
    return values.filter((v, i, a) => a.indexOf(v) === i && v !== '').map((muscleGroup) => {
      return {
        "name": muscleGroup,
        "value": muscleGroup
      }
    })
  }
}

interface YoutubeApiOptions {
  endPoint: "playlists" | "playlistItems"
  key: string
  channelId?: string
  playlistId?: string
  part?: string
  maxResults: number
}

interface YoutubeInfo {
  guildId: string
  channelId: string
  playlistTitles: string[]
}

export interface Choice {
  name: string
  value: string
}

interface Choices {
  muscleGroupChoices: Choice[]
  primaryMuscleChoices: Choice[]
  equipmentChoices: Choice[]
}