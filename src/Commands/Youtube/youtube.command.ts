import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"
import axios from "axios"
import { VideoRecord, YoutubeAPIResult, YoutubePlaylist, YoutubePlaylistItem } from "@types"
import { db } from "../../firebase"
import { youtubeKey } from "../../config";
import { BaseEmbed } from "../../Bot/embed"
import { Command } from "@types"
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits } from "discord-api-types/v10"
import Youtube from "../../APIs/Youtube"

// const pl = 'UUGyh9ICzUcKVpx7SDP9ZmwQ'
const programs = [
  "Olympus",
  "Denali",
  "Kilauea",
  "Everest",
]

export default {
  name: 'youtube',
  register: async function (guildId) {
    return {
      "name": 'youtube',
      "type": ApplicationCommandType.ChatInput,
      "description": 'Command set regarding Youtube integration',
      "default_member_permissions": PermissionFlagsBits.Administrator.toString(),
      "options": [
        {
          "name": 'fetch',
          "type": ApplicationCommandOptionType.Subcommand,
          "description": 'Fetches videos from Youtube API and saves them into database.'
        },
      ]
    }
  },
  run: async function (interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "fetch": {
        const youtube = new Youtube()
        const res = await youtube.getYoutubeVideos()
        interaction.reply({ embeds: [new BaseEmbed().setTitle('Complete').setDescription(`Finished updating ${ res } videos from Youtube`)]})
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
} as Command

async function fetchVideos(interaction: CommandInteraction) {
  const embed = new BaseEmbed()
      .setTitle(`Getting Videos from Youtube...`)
  await interaction.reply({ embeds: [embed]})

  // Get playlists...
  const playlists = await getYoutubeResults<YoutubePlaylist>({
    key: youtubeKey,
    endPoint: "playlists",
    channelId: 'UCGyh9ICzUcKVpx7SDP9ZmwQ',
    part: 'snippet',
    maxResults: 50
  })

  const programsPlaylists = playlists.filter((playlist) => programs.includes(playlist.snippet.title))

  // Get videos in playlists...
  let videoList: YoutubePlaylistItem[] = []
  for await (const playlist of programsPlaylists) {
    const videos = await getYoutubeResults<YoutubePlaylistItem>({
      key: youtubeKey,
      endPoint: "playlistItems",
      playlistId: playlist.id,
      part: 'snippet',
      maxResults: 50
    })
    videoList = [...videoList, ...videos];
  }
  // Filter deleted videos
  videoList = videoList.filter((video) => video.snippet.title !== 'Deleted video')

  // Reply
  const videoRefs = await upsertVideos(videoList, programsPlaylists)


  embed.setTitle(`Video Data Saved: ${ videoRefs.length } videos`)
  videoRefs.forEach(async (video, index) => {
    const videoData = <VideoRecord>(await video.get()).data()
    embed.addFields({ name: videoData.title, value: videoData.videoUrl})

    if (index % 20 === 0) {
      await interaction.followUp({ embeds: [ embed ]})
    }
  })
  await interaction.followUp({ embeds: [ embed ]})


  console.log(videoList.length)
}


async function getYoutubeResults<T>(options: YoutubeApiOptions, prevPage?: YoutubeAPIResult<T>): Promise<T[]> {
  let url = getYoutubeEndpoint(options)

  if (prevPage?.nextPageToken) {
    url += `&pageToken=${ prevPage?.nextPageToken }`
  }

  const data: YoutubeAPIResult<T> = (await axios(url)).data

  if (prevPage) {
    data.items = [...prevPage.items, ...data.items]
  }

  if (data.nextPageToken) {
    return getYoutubeResults(options, data);
  } else {
    return data.items;
  }
}

async function upsertVideos(videoList: YoutubePlaylistItem[], playlists: YoutubePlaylist[]) {
  const videosRef = db.collection('videos')
  const oldVideos = await videosRef.listDocuments()

  oldVideos.forEach(async (video) => {
    await video.delete()
  })

  let regexTarget = /(?<=Target:).+/
  let regexPrimary = /(?<=Primary:).+/
  let regexSecondary = /(?<=Secondary:).+/
  let regexEquip = /(?<=Equipment:).+/


  return await Promise.all(
    videoList.map(async (video) => {
      const matchedTarget = video.snippet.description.match(regexTarget);
      const matchedPrimary = video.snippet.description.match(regexPrimary);
      const matchedSecondary = video.snippet.description.match(regexSecondary);
      const matchedEquip = video.snippet.description.match(regexEquip);

      const muscleGroups = matchedTarget ? matchedTarget[0].trim().split(', ') : []
      const primaryMuscles = matchedPrimary ? matchedPrimary[0].trim().split(', ') : []
      const secondaryMuscles = matchedSecondary ? matchedSecondary[0].trim().split(', ') : []
      const equipment = matchedEquip ? matchedEquip[0].trim().split(', ') : []

      const { snippet } = video;
      const [ title, modification ] = snippet.title.split(' - ').map((item) => item.trim())
      const { snippet: { title: program } } = playlists.find((playlist) => playlist.id === video.snippet.playlistId)!
      const { playlistId, position, videoOwnerChannelTitle, videoOwnerChannelId, resourceId, ...record } = snippet
      record.title = title
      return await videosRef.add({
        ...record,
        videoId: resourceId?.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${ resourceId?.videoId }`,
        modification: modification ? modification : '',
        program: program ? program : '',
        muscleGroups,
        primaryMuscles,
        secondaryMuscles,
        equipment
      })
    })
  )

}

function getYoutubeEndpoint(options: YoutubeApiOptions): string {
  const baseUrl = 'https://www.googleapis.com/youtube/v3/'
  let url = `${ baseUrl }${ options.endPoint }?&key=${ youtubeKey }`
  url += options.channelId ? `&channelId=${ options.channelId }` : ``
  url += options.playlistId ? `&playlistId=${ options.playlistId }` : ``
  url += options.part ? `&part=${ options.part }` : ``
  url += options.maxResults ? `&maxResults=${ options.maxResults }` : ``
  return url
}

interface YoutubeApiOptions {
  endPoint: "playlists" | "playlistItems"
  key: string
  channelId?: string
  playlistId?: string
  part?: string
  maxResults: number
}