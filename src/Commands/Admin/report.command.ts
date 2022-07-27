import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { reportWorkout } from "./report/report.workouts"
import { reportCardio } from "./report/report.cardio"

export default {
  name: "report",
  register: async function (guildId: string) {
    return new SlashCommandBuilder()
      .setName("report")
      .setDescription("Gets data from DB")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("workout")
          .setDescription("compile and report workout logs from GainTrust servers")
          .addNumberOption((option) =>
            option
              .setName("month")
              .setDescription("The month to calculate the logs for")
              .setRequired(true)
              .setChoices(
                { name: "January", value: 1 },
                { name: "February", value: 2 },
                { name: "March", value: 3 },
                { name: "April", value: 4 },
                { name: "May", value: 5 },
                { name: "June", value: 6 },
                { name: "July", value: 7 },
                { name: "August", value: 8 },
                { name: "September", value: 9 },
                { name: "October", value: 10 },
                { name: "November", value: 11 },
                { name: "December", value: 12 },
              )
          )
          .addNumberOption((option) => option.setName("year").setDescription("The year to calculate the logs for").setRequired(true))
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("cardio")
          .setDescription("compile and report cardio logs from GainTrust servers")
          .addNumberOption((option) =>
            option
              .setName("month")
              .setDescription("The month to calculate the logs for")
              .setRequired(true)
              .setChoices(
                { name: "January", value: 1 },
                { name: "February", value: 2 },
                { name: "March", value: 3 },
                { name: "April", value: 4 },
                { name: "May", value: 5 },
                { name: "June", value: 6 },
                { name: "July", value: 7 },
                { name: "August", value: 8 },
                { name: "September", value: 9 },
                { name: "October", value: 10 },
                { name: "November", value: 11 },
                { name: "December", value: 12 },
              )
          )
          .addNumberOption((option) => option.setName("year").setDescription("The year to calculate the logs for").setRequired(true))
      )
      .toJSON()
  },
  run: async function (interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "workout": {
        await reportWorkout(interaction)
        break
      }
      case "cardio": {
        await reportCardio(interaction)
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
}
