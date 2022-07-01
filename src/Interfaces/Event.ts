import { ClientEvents } from "discord.js"

export type Run = (...args: any[]) => void | Promise<void>

export interface Event {
  name: keyof ClientEvents
  run: Run
}
