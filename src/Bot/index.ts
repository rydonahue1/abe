import { Command, Event } from "@types"
import { Client, Collection, CommandInteraction } from "discord.js"
import glob from "glob"
import { promisify } from "util"
import { REST } from "@discordjs/rest"
import { APIApplicationCommand, GatewayIntentBits, RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v10"
import { db } from "../firebase"
import { RegisterCommand } from "@types"

const globPromise = promisify(glob)

export default class Bot extends Client {
  public events: Collection<string, Event> = new Collection()
  public aliases: Collection<string, Command> = new Collection()
  public commands: Collection<string, Command> = new Collection()
  public activeCommands: Collection<string, string> = new Collection()
  public restApi: REST
  // private static instance: Bot;

  public constructor(token: string) {
    super({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] })
    this.restApi = new REST({ version: "10" }).setToken(token)
  }

  public async init(): Promise<void> {
    await this.registerEvents()
    const commandData = await this.importCommandFiles()
    // await this.upsertCommandOptions(commandData)
    await this.registerGuildCommands(commandData)
  }

  public async upsertGuilds(): Promise<void> {
    const guildsRef = db.collection("guilds")
    this.guilds.cache.forEach(async (guild) => {
      const { id, name, ownerId, joinedAt, memberCount, icon, banner } = guild
      const guildDoc = guildsRef.doc(guild.id)
      const { user } = await guild.members.fetch(ownerId)

      await guildDoc.set(
        {
          id,
          name,
          joinedAt,
          memberCount,
          icon,
          banner,
          owner: {
            id: user?.id,
            displayName: user?.username,
            avatar: user.avatarURL(),
            discriminator: user?.discriminator,
            mentionable: user?.toString(),
          },
        },
        { merge: false }
      )
    })
  }

  /**
   * Imports all files in the command folder with command in the filename
   */
  private async importCommandFiles() {
    const commandFiles: string[] = await globPromise(`${__dirname}/../Commands/**/*.command.*`)
    return Promise.all(
      commandFiles.map(async (filePath) => {
        const command = <Command>(await import(filePath)).default
        this.commands.set(command.name, command)
        return command.register
      })
    )
  }

  /**
   *Maybe use this in the future to import both commands and events
   */
  private async importFiles<T extends "Command" | "Event">(type: T) {
    const files: string[] = await globPromise(`${__dirname}/../${ type }s/**/*.${type.toLowerCase()}.*`)
    return Promise.all(
      files.map(async (filePath) => {
        if (type === "Command") {
          const command = <Command>(await import(filePath)).default
          this.commands.set(command.name, command)
          return command.register
        } else if (type === "Event") {
          const event = <Event>(await import(filePath)).default
          this.events.set(event.name, event)
          return event
        }
      })
    )
  }

  /**
   * Saves default commands to the database
   */
  private async upsertCommandOptions(commands: RESTPostAPIApplicationCommandsJSONBody[]) {
    return await Promise.all(
      commands.map(async (command) => {
        const write = await db.doc(`commands/${command.name}`).set(command)
        if (!write) console.log(`${write} failed to save`)
      })
    )
  }

  private async registerGuildCommands(registerCommands: RegisterCommand[]) {
    await Promise.all(
      this.guilds?.cache.map(async (guild) => {
        if (this.application) {
          console.log(`Refreshing application (/) commands for ${guild.name}.`)
          const commandsJSON = await this.getCommandRegistrationJSON(registerCommands, guild.id)
          const registered = <APIApplicationCommand[]>(
            await this.restApi.put(Routes.applicationGuildCommands(this.application.id, guild.id), { body: commandsJSON })
          )
          console.log(`Registered ${registered.length} (/) commands for ${guild.name}.`)
        }
      })
    )
  }

  /**
   * Using this function allows us to dynamically register unique options for each guild
   * @param registerCommands Array oof register command functions
   * @param guildId
   * @returns JSON object to pass over to Discord API to register the command
   */
  private async getCommandRegistrationJSON(registerCommands: RegisterCommand[], guildId: string) {
    return await Promise.all(
      registerCommands.map(async (registerCommand) => {
        return await registerCommand(guildId)
      })
    )
  }

  private async registerEvents() {
    const eventfiles: string[] = await globPromise(`${__dirname}/../Events/**/*.*`)
    await Promise.all(
      eventfiles.map(async (filePath: string) => {
        const { event }: { event: Event } = await import(filePath)

        if (this.events.has(event.name)) return
        this.events.set(event.name, event)
        this.on(event.name, async (...args) => {
          const eventFunction = this.events.get(event.name)
          await eventFunction?.run(...args, this)
        })
        // Old method of binding client to run function
        // this.on(event.name, event.run.bind(null, this))
      })
    )
  }

  setActiveCommand(interaction: CommandInteraction) {
    if (this.activeCommands.has(interaction.user.id))
      throw new Error("Relax bud, you already had me running a command and now I'm just confused. Lets start this over again.")
    this.activeCommands.set(interaction.user.id, interaction.commandName)
  }

  unsetActiveCommand(interaction: CommandInteraction) {
    this.activeCommands.delete(interaction.user.id)
  }
}
