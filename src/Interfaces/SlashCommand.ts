import Bot from "../Bot";
import { CommandInteraction } from "discord.js"
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from "@discordjs/builders"

export type Run = (client: Bot, interaction: CommandInteraction) => Promise<void>

export interface SlashCommand {
  name: string
  description?: string
  requiredRoles?: string[]
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder
  run: Run
}
