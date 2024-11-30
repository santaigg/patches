import { SlashCommand, SlashCommandConfig } from "@/types/command"
import axios from "axios"
import { EmbedBuilder } from "discord.js"
import rankMapping from "./rankMapping.json" // Import the rankMapping JSON

const config: SlashCommandConfig = {
  name: "get_rank",
  description: "Fetch the game ranks for a specific player",
  usage: "/rank",
  options: [
    {
      name: "playerid",
      description: "Get The Rank of a plyer through ID of the player",
      type: "STRING",
      required: true,
    },
  ],
}

const command: SlashCommand = {
  execute: async (interaction) => {
    const playerId = interaction.options.get("playerid")?.value as string

    try {
      // Acknowledge the interaction immediately to prevent timeout
      await interaction.deferReply()

      // Fetch game ranks from the API
      const response = await axios.get(
        `https://wavescan-production.up.railway.app/api/v1/player/${playerId}/game_ranks`
      )

      const { success, solo_rank, team_rank } = response.data

      if (!success) {
        await interaction.editReply(`Failed to fetch ranks for player ${playerId}.`)
        return
      }

      // Map the ranks to their corresponding names and emojis
      const soloRank = (rankMapping[solo_rank]?.name || "Unknown") + " " + (rankMapping[solo_rank]?.emoji || "")
      const teamRank = (rankMapping[team_rank]?.name || "Unknown") + " " + (rankMapping[team_rank]?.emoji || "")

      // Create a nice looking embed using EmbedBuilder
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Player ${playerId} Game Ranks`)
        .setDescription(`Here are the ranks for player ${playerId}:`)
        .addFields(
          { name: "🎯 Solo Rank", value: soloRank || "N/A", inline: true },
          { name: "🤝 Team Rank", value: teamRank || "N/A", inline: true }
        )
        .setFooter({
          text: "Rank data provided by Spectre Divide Bot",
          iconURL: "https://barronbucket.nyc3.digitaloceanspaces.com/screenshot/85729/Spectre_Divide_Puck_White.png",
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      console.error(`Failed to fetch ranks for player ${playerId}:`, error)
      await interaction.followUp(
        `There was an error fetching the ranks for player ${playerId}.`
      )
    }
  },
}

export default { command, config }