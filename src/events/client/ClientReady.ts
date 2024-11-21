import { type DiscordClient } from "@/lib/client"
import { Logger } from "@/lib/logger"
import { ActivityType } from "discord.js"

export default async (client: DiscordClient) => {
  Logger.info(`Logged in as ${client.user?.tag}!`)
  // Set the bot's status
  client.user?.setActivity({
    name: "Santai.GG",
    type: ActivityType.Custom,
  })
}
