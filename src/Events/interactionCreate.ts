import { Event } from "@types"
import { CommandInteraction } from "discord.js"
import Bot from "../Bot"

export const event: Event = {
  name: "interactionCreate",
  run: async (interaction: CommandInteraction, bot: Bot) => {
    console.log(interaction.createdTimestamp);
    if (!interaction.isCommand()) return
    const { commandName } = interaction
    const requestedCommand = bot.commands.get(commandName)

    // Used to bind the client and pass it into the function to get commands
    // const requestedCommand = bot.commands.get(commandName)

    requestedCommand?.run(interaction)
  },
}
