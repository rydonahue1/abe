import { ChatInputCommandInteraction, CommandInteraction } from "discord.js"
import { getLogs, groupLogsByUser, reportLogs, reportWinner } from "./report.functions"
import { CardioLog } from "@types"

/**
 * Fetches all cardio logs for requested time period,
 * builds an embed of everyone who logged with their amounts,
 * and announces a winner(s)
 * @param interaction Discord interaction that initiated the call
 */
export async function reportCardio(interaction: ChatInputCommandInteraction): Promise<void> {
  // Get command values...
  const logType = interaction.options.getSubcommand();
  const month = interaction.options.getNumber('month', true)
  const year = interaction.options.getNumber('year', true)

  // Create date range...
  const startDay = new Date(year, (month - 1), 1, 0, 0, 0)
  const endDay = new Date(year, month, 1, 0, 0, 0)

  // Tally and group logs...
  const logsRef = await getLogs(logType, startDay, endDay)
  const logsGroupedByUser = groupLogsByUser<CardioLog>(logsRef)

  // Send reply...
  await reportLogs(interaction, logsGroupedByUser)
  await reportWinner(interaction, logsGroupedByUser)
}

