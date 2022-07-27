import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { logCardio } from "./subcommands/log-cardio"
import { logWorkout } from "./subcommands/log-workout"


export default {
  name: "log",
  register: async function (guildId: string) {
    return new SlashCommandBuilder()
    .setName("log")
    .setDescription("Logs an activity")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("workout")
        .setDescription("Logs workout to GainTrust servers")
        .addStringOption((option) =>
          option
            .setName("lift-type")
            .setDescription("Which body part you hit")
            .setRequired(true)
            .addChoices(
              { name: "Push Day", value: "Push Day"},
              { name: "Pull Day", value: "Pull Day"},
              { name: "Leg Day", value: "Leg Day"},
              { name: "Back Day", value: "Back Day"},
              { name: "Shoulder Day", value: "Shoulder Day"},
              { name: "Arm Day", value: "Arm Day"},
              { name: "Accessory Day", value: "Accessory Day"},
              { name: "Full Body", value: "Full Body"},
            )
        )
        .addNumberOption((option) =>
          option
            .setName("date")
            .setDescription("Which day you lifted")
            .setRequired(true)
            .addChoices(
              { name: "Today", value: 0},
              { name: "Yesterday", value: 1},
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("cardio")
        .setDescription("Logs cardio session to GainTrust servers")
        .addNumberOption((option) => option.setName("minutes").setDescription("How many minutes did you workout?").setRequired(true))
        .addNumberOption((option) =>
          option
            .setName("intensity")
            .setDescription("Which intensity level did you mostly work out in?")
            .setRequired(true)
            .addChoices(
              { name: "Zone 1 (50-60% MHR)", value: 1},
              { name: "Zone 2 (60-70% MHR)", value: 2},
              { name: "Zone 3 (70-80% MHR)", value: 3},
              { name: "Zone 4 (80-90% MHR)", value: 4},
              { name: "Zone 5 (90-100% MHR)", value: 5},
            )
        )
        .addNumberOption((option) =>
          option
            .setName("date")
            .setDescription("On Which Day?")
            .setRequired(true)
            .addChoices(
              { name: "Today", value: 0},
              { name: "Yesterday", value: 1},
            )
        ),
    ).toJSON()
  },
  run: async function (interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "workout": {
        await logWorkout(interaction)
        break
      }
      case "cardio": {
        await logCardio(interaction)
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
}