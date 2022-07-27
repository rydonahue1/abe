import { ChatInputCommandInteraction } from "discord.js"
import { getLogs, groupLogsByUser, reportLogs, reportWinner } from "./report.functions"
import { WorkoutLog } from "@types"

const workout_types = [
  "Push Day",
  "Pull Day",
  "Leg Day",
  "Chest Day",
  "Back Day",
  "Shoulder Day",
  "Arm Day",
  "Accessory Day",
  "Full Body",
]
 export async function reportWorkout(interaction: ChatInputCommandInteraction): Promise<void> {

    // Get command values...
    const logType = interaction.options.getSubcommand();
    const month = interaction.options.getNumber('month', true)
    const year = interaction.options.getNumber('year', true)

    // Create date range...
    const startDay = new Date(year, (month - 1), 1, 0, 0, 0)
    const endDay = new Date(year, month, 1, 0, 0, 0)

    // Tally and group logs...
    const logsRef = await getLogs(logType, startDay, endDay)
    const logsGroupedByUser = groupLogsByUser<WorkoutLog>(logsRef)

    // Send reply...
    await reportLogs(interaction, logsGroupedByUser)
    await reportWinner(interaction, logsGroupedByUser)
}