import type { Command, Event, Config, RegisterCommand } from "./bot"
import type { YoutubeAPIResult, YoutubePlaylist, YoutubePlaylistItem, Snippet } from "./youtube"
import type { GuildRecord, GuildOwner } from "./database/guilds";
import type { CommandOptionsRecord } from "./database/commandOptions";
import type { LogRecord, WorkoutLog, CardioLog, CardioStats, UsersLogs, DiscordUser, LogTypes, LiftTypes } from "./database/logs";
import type { VideoRecord } from "./database/videos";

// Bot Types
export type {
  Command, Event, RegisterCommand, Config
}

// Youtube API Types
export type {
  YoutubeAPIResult, YoutubePlaylist, YoutubePlaylistItem, Snippet
}

// CommandOptions Types
export type {
  CommandOptionsRecord
}

// Guild Types
export type {
  GuildRecord, GuildOwner
}

// Log Types
export type {
  LogRecord, WorkoutLog, CardioLog, CardioStats, UsersLogs, DiscordUser, LogTypes, LiftTypes
}

// Video Types
export type {
  VideoRecord
}