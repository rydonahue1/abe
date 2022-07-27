import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"
import { searchVideos } from "./videos/videos.search"
import { collections } from "../../Firebase/collections"
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Command } from "@types"


// const pl = 'UUGyh9ICzUcKVpx7SDP9ZmwQ'
const programs = [
  "Olympus",
  "Denali",
  "Kilauea",
  "Everest",
]

export default {
  name: "videos",
  register: async function (guildId: string) {

    const guildCommandOptions = await collections.commandOptions.doc(guildId).get()
    const defaultCommandOptions = await collections.commandOptions.doc('default').get()
    const commandOptions = guildCommandOptions.exists ? guildCommandOptions.data() : defaultCommandOptions.data()
    return {
      "name": "videos",
      "description": "Searches the Gaintrust workout video library",
      "options": [
        {
          "name": 'search',
          "description": 'Fetches videos from Youtube API and saves them into database.',
          "type": ApplicationCommandOptionType.Subcommand,
          "options": [
            {
              "name": "primary-muscle",
              "description": "Search by specific muscle",
              "type": ApplicationCommandOptionType.String,
              "required": true,
              "choices": commandOptions?.primaryMuscles,
            },
          ]
        },
      ]
    } as RESTPostAPIApplicationCommandsJSONBody
  },
  run: async function (interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "search": {
        await searchVideos(interaction)
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
} as Command
