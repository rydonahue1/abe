import { CommandInteraction } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"
import { reportWorkout } from "./report/report.workouts"
import { reportCardio } from "./report/report.cardio"

export default {
  name: "report",
  requiredRoles: ['Admin', 'Mod'],
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Gets data from DB")
    .setDefaultPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("workout")
        .setDescription("compile and report workout logs from GainTrust servers")
        .addNumberOption((option) =>
          option
            .setName("month")
            .setDescription("The month to calculate the logs for")
            .setRequired(true)
            .addChoices([
              ["January", 1],
              ["February", 2],
              ["March", 3],
              ["April", 4],
              ["May", 5],
              ["June", 6],
              ["July", 7],
              ["August", 8],
              ["September", 9],
              ["October", 10],
              ["November", 11],
              ["December", 12],
            ])
        )
        .addNumberOption((option) =>
          option
            .setName("year")
            .setDescription("The year to calculate the logs for")
            .setRequired(true)
        )
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
            .addChoices([
              ["January", 1],
              ["February", 2],
              ["March", 3],
              ["April", 4],
              ["May", 5],
              ["June", 6],
              ["July", 7],
              ["August", 8],
              ["September", 9],
              ["October", 10],
              ["November", 11],
              ["December", 12],
            ])
        )
        .addNumberOption((option) =>
          option
            .setName("year")
            .setDescription("The year to calculate the logs for")
            .setRequired(true)
        )
    ),
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "workout": {
        await reportWorkout(interaction);
        break
      }
      case "cardio": {
        await reportCardio(interaction);
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
}