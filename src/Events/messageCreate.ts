import { Event } from "@types"
import { Message, MessageType } from "discord.js"

export const event: Event = {
  name: "messageCreate",
  run: async (message: Message) => {
    if (message.type === MessageType.ChatInputCommand) return
    // console.log(message.content, 'message create');
  },
}