import { OverwriteResolvable, Role, GuildMember, Collection, PermissionString } from "discord.js"

type Entity = Role | GuildMember | Collection<string, Role> | Collection<string, GuildMember>;

export function createPermissionOverrides(entries: Entity, allow: PermissionString[] = [], deny: PermissionString[] = [], overwrites: OverwriteResolvable[] = []): OverwriteResolvable[] {
  if (entries instanceof Map) {
    for (const [index, entry] of entries) {
      console.log(index);
      overwrites = [
        ...overwrites,
        {
          id: entry,
          allow,
          deny,
        },
      ]
    }
  } else {
    overwrites = [
      ...overwrites,
      {
        id: entries,
        allow,
        deny,
      },
    ]
  }

  return overwrites
}