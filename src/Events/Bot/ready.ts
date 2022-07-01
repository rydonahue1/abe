import { Client } from "discord.js"
import { Event } from "../../Interfaces"

export const event: Event = {
  name: "ready",
  run: async (bot : Client) => {
    console.log(`${bot.user?.tag} is online`)
  },
}
