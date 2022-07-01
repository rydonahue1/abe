import { Guild } from "discord.js"
import { GuildMember, MessageAttachment } from "discord.js"

// UCheck if person who sent message has a role
export function hasRole(member: GuildMember, requiredRole: string | string[]) {
  if (typeof requiredRole === 'string') {
    if (!member.roles.cache.some((role) => role.name === requiredRole)) {
      throw new Error("Error: User does not have permissions")
    }
  } else {
    if (!member.roles.cache.some((role) => requiredRole.includes(role.name))) {
      throw new Error("Error: User does not have permissions")
    }
  }
}

// Check if file type matches required
export function isFileType(attachment: MessageAttachment, fileType: string) {
  if (!attachment.name?.endsWith(fileType)) {
    throw new Error("Error: Wrong file type")
  }
}

export function channelExists(server: Guild, name: string) {
  console.log(name)
  server.channels.cache.mapValues(channel => console.log(channel.name))
  if (server.channels.cache.some(channel => channel.name === name.toLowerCase())) {
    throw new Error("Error: Channel already exists");
  }
}
