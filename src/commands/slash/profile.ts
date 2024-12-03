import { SlashCommand, SlashCommandConfig } from "@/types/command";
import axios from "axios";
import { EmbedBuilder, Interaction } from "discord.js";
import rankMapping from "./rankMapping.json";

const config: SlashCommandConfig = {
    name: "profile",
    description: "Grabs a snippet of the user's profile",
    usage: "/profile",
    options: [
        {
            name: "playerid",
            description: "Player ID to grab",
            type: "STRING",
            required: true,
        },
    ],
};

const calculatePlayerStats = (matches: any[], playerId: string) => {
    let totalKills = 0,
        totalDeaths = 0,
        totalWins = 0;

    matches.forEach((match) => {
        let playerFound = false;
        match.player_team.players.forEach((player: any) => {
            if (player.id === playerId) {
                totalKills += player.kills;
                totalDeaths += player.deaths;
                playerFound = true;
                if (match.winner === 0) totalWins++;
            }
        });

        if (!playerFound) {
            match.opponent_team.players.forEach((player: any) => {
                if (player.id === playerId) {
                    totalKills += player.kills;
                    totalDeaths += player.deaths;
                    if (match.winner === 1) totalWins++;
                }
            });
        }
    });

    const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toString();
    const totalMatches = matches.length;
    const winPercentage = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(2) : "0";

    return { totalKills, totalDeaths, kdRatio, totalWins, winPercentage };
};

const command: SlashCommand = {
    execute: async (interaction: Interaction) => {
        if (!interaction.isCommand()) return;

        const playerId = interaction.options.get("playerid")?.value as string;

        try {
            await interaction.deferReply();

            const response = await axios.get(`https://wavescan-production.up.railway.app/api/v1/player/${playerId}/full_profile`);
            const playerProfile = response.data;

            const { name, stats, steam_profile, matches } = playerProfile;
            const recentMatches = matches.slice(0, 20);
            const playerStats = calculatePlayerStats(matches, playerId);

            const soloRankData = rankMapping[stats?.current_solo_rank] || { name: "Unranked", emoji: "😶" };
            const soloRank = `${soloRankData.emoji} ${soloRankData.name}`;

            const steamAvatar = steam_profile?.avatar?.medium || "https://default-avatar-url.png";

            const recentMatchesStats = recentMatches
                .map((match: any, index: number) => {
                    let kills = 0,
                        deaths = 0,
                        playerFound = false;

                    match.player_team.players.forEach((player: any) => {
                        if (player.id === playerId) {
                            kills = player.kills;
                            deaths = player.deaths;
                            playerFound = true;
                        }
                    });

                    if (!playerFound) {
                        match.opponent_team.players.forEach((player: any) => {
                            if (player.id === playerId) {
                                kills = player.kills;
                                deaths = player.deaths;
                            }
                        });
                    }

                    return `• Match ${index + 1}: **${kills}** Kills / **${deaths}** Deaths`;
                })
                .join("\n");

            const statsEmbed = new EmbedBuilder()
                .setColor("#5865F2") 
                .setTitle(`🎮 Player Profile: ${name || "Unknown Player"}`)
                .setDescription(`Here are the stats for **${name || "this player"}**.`)
                .setThumbnail(steamAvatar)
                .addFields(
                    { name: "🏆 Rank", value: soloRank, inline: true },
                    { name: "📈 Win %", value: `${playerStats.winPercentage}%`, inline: true },
                    { name: "⚖️ K/D", value: `${playerStats.kdRatio}`, inline: true },
                    { name: "🔹 Kills", value: `${playerStats.totalKills}`, inline: true },
                    { name: "🔹 Deaths", value: `${playerStats.totalDeaths}`, inline: true },
                    { name: "🏅 Wins", value: `${playerStats.totalWins}`, inline: true }
                )
                .addFields({
                    name: "📋 Recent Matches",
                    value: recentMatchesStats.length > 1024
                        ? `**Latest Summary:**\n${recentMatchesStats.slice(0, 5).join("\n")}\n\n**...and more!**`
                        : recentMatchesStats || "No recent matches found.",
                })
                .setTimestamp()
                .setFooter({
                    text: "Stats powered by Santai.GG",
                    iconURL: "https://barronbucket.nyc3.digitaloceanspaces.com/screenshot/85729/Spectre_Divide_Puck_White.png", // Replace with a relevant icon
                });

            await interaction.editReply({ embeds: [statsEmbed] });
        } catch (err) {
            console.error("Error fetching player profile:", err);
            await interaction.editReply("An error occurred while fetching player profile data.");
        }
    },
};

export default { command, config };