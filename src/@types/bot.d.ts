import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from "@discordjs/builders"
import { ClientEvents } from "discord.js"

export type Run = (...args: any[]) => Promise<void>

export interface Command {
  name: string
  description?: string
  requiredRoles?: string[]
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder
  run: Run
}

export interface Event {
  name: keyof ClientEvents
  run: Run
}

export interface Config {
  token: string
  prefix: string
  firebase_admin: Object
  firebase_bucket: string
}