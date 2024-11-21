import { SlashCommand, SlashCommandConfig } from "@/types/command";
import axios from "axios";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"; // Correct imports for v14
import rankMapping from "./rankMapping.json"; // Import the rank mapping

const config: SlashCommandConfig = {
  description: "Display the current leaderboard on Santai.GG",
  usage: "/leaderboard",
};

const command: SlashCommand = {
  execute: async (interaction) => {
    try {
      await interaction.deferReply();

      // Fetch leaderboard data from the API
      const response = await axios.get(
        "https://wavescan-production.up.railway.app/api/v1/leaderboard/solo_ranked"
      );

      const leaderboard = response.data?.leaderboard;
      if (!leaderboard || leaderboard.length === 0) {
        await interaction.editReply("No leaderboard data available.");
        return;
      }

      // Function to generate an embed for a specific page
      const generateLeaderboardEmbed = (page: number, itemsPerPage: number) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const entries = leaderboard.slice(start, end);

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(`Santai.GG Leaderboard (Page ${page + 1})`)
          .setDescription("Current Solo Ranked Leaderboard")
          .setFooter({
            text: `There are ${totalPages} total pages.`,
            iconURL: "https://barronbucket.nyc3.digitaloceanspaces.com/screenshot/85729/Spectre_Divide_Puck_White.png",
          })
          
          .setTimestamp();

        // Add each entry to the embed
        entries.forEach((player) => {
          // Get the player's rank and emoji from the rankMapping
          const rank = rankMapping[player.current_solo_rank]; // Using current_solo_rank to map rank
          const rankDisplay = rank ? `${rank.emoji} ${rank.name}` : "Unranked";

          embed.addFields({
            name: `${player.rank}. ${player.display_name} - ${rankDisplay}`,
            value: `Rank Rating: **${player.rank_rating}**`,
            inline: false,
          });
        });

        return embed;
      };

      // Pagination setup
      let currentPage = 0;
      const itemsPerPage = 10;
      const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

      // Initial embed
      const embed = generateLeaderboardEmbed(currentPage, itemsPerPage);

      // Action buttons
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("⬅️ Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("➡️ Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1)
      );

      // Send the initial message
      const message = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      // Button interaction collector
      const collector = message.createMessageComponentCollector({
        time: 60000, // Collector runs for 60 seconds
      });

      collector.on("collect", async (buttonInteraction) => {
        if (buttonInteraction.user.id !== interaction.user.id) {
          await buttonInteraction.reply({
            content: "You cannot interact with this button.",
            ephemeral: true,
          });
          return;
        }

        // Update the page based on the button clicked
        if (buttonInteraction.customId === "previous" && currentPage > 0) {
          currentPage--;
        } else if (
          buttonInteraction.customId === "next" &&
          currentPage < totalPages - 1
        ) {
          currentPage++;
        }

        // Update the embed and buttons
        const updatedEmbed = generateLeaderboardEmbed(currentPage, itemsPerPage);
        const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("⬅️ Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("➡️ Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );

        await buttonInteraction.update({
          embeds: [updatedEmbed],
          components: [updatedRow],
        });
      });

      collector.on("end", async () => {
        // Disable buttons when collector ends
        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("⬅️ Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("➡️ Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        await message.edit({
          components: [disabledRow],
        });
      });
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      await interaction.followUp("An error occurred while fetching the leaderboard.");
    }
  },
};

export default { command, config };
