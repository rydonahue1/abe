import { Event } from "@types"
import { Message } from "discord.js"

export const event: Event = {
  name: "messageCreate",
  run: async (message: Message) => {
    if (message.type === "APPLICATION_COMMAND") return
    // console.log(message.content, 'message create');
  },
}