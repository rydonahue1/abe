
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from "@discordjs/builders"

export type Run = (...args: any[]) => Promise<void>

export interface Command {
  name: string
  description?: string
  requiredRoles?: string[]
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder
  run: Run
}
