import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from "@discordjs/builders"
import { ClientEvents } from "discord.js"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";

type Run = (...args: any[]) => Promise<void>
export type RunCommand = Run
export type RunEvent = Run
export type RegisterCommand = (guildId: string) => Promise<RESTPostAPIApplicationCommandsJSONBody>

export interface Command {
  name: string
  description?: string
  requiredRoles?: string[]
  register: RegisterCommand
  run: RunCommand
}

export interface Event {
  name: keyof ClientEvents
  run: RunEvent
}

export interface Config {
  token: string
  prefix: string
  firebase_admin: Object
  firebase_bucket: string
}