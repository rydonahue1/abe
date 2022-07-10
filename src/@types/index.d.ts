import type { Command, Event, Config } from "./bot";
import { YoutubeResults } from "./youtube";
export type {
  Command,
  Event,
  Config,
  YoutubeResults
}

export type LiftTypes = "Push Day" | "Pull Day" | "Leg Day" | "Chest Day" | "Back Day" | "Shoulder Day" | "Arm Day" | "Accessory Day" | "Full Body"
export type LogTypes = "workout" | "cardio"

export interface Log {
  created: Timestamp
  date: Timestamp
  logType: LogTypes
  image: string
  user: DiscordUser
}

export interface WorkoutLog extends Log {
  liftType: LiftTypes
}

export interface CardioLog extends Log {
  intensity: number
  minutes: number
}

export type CardioStats = Pick<CardioLog, "minutes" | "intensity"> & {
  count?: number
}

export interface UsersLogs<T extends WorkoutLog | CardioLog> {
  user: DiscordUser
  logs: T[];
}

export interface DiscordUser {
  avatar: string;
  discriminator: string;
  id: string;
  username: string;
}