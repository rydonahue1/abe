import { CommandInteraction } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"
import axios from "axios"
import { YoutubeResults } from "@types"




export default {
  name: "youtube",
  data: new SlashCommandBuilder()
    .setName("youtube")
    .setDescription("Logs an activity")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("fetch")
        .setDescription("Logs workout to GainTrust servers")
    ),
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "fetch": {
        await fetchVideos(interaction)
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
}

// TY.ListTypePlaylist
async function fetchVideos(interaction: CommandInteraction) {
  const url = 'https://www.googleapis.com/youtube/v3/playlistItems?playlistId=UUGyh9ICzUcKVpx7SDP9ZmwQ&key=AIzaSyDw0546R3Tducg_aTYWReAhpExv_2O2LPg&part=snippet&maxResults=50'
  const res = await axios(url)
  const data: YoutubeResults = res.data
  
  data.items.filter((item) => item.kind === "youtube#searchResult")

  console.log(data);
}