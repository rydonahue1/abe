export interface GuildOwner {
  avatar: string
  discriminator: string
  displayName: string
  id: string
  mentionable: string
}

export interface GuildRecord {
  banner: string | null
  icon: string | null
  id: string
  joinedAt: Date
  memberCount: number
  name: string
  owner: GuildOwner
}