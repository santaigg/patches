import { SlashCommand, SlashCommandConfig } from "@/types/command";
import axios from "axios";
import { EmbedBuilder } from "discord.js";
import rankMapping from "./rankMapping.json"

function calculateKD(kills: number, deaths: number): string {
    if (kills === 0 && deaths === 0) {
        return 'Stats not available'; // Custom message for no stats
    }
    if (deaths === 0) {
        return kills === 0 ? 'N/A' : '∞'; // If no deaths but kills exist, return "∞"
    }
    if (kills === 0) {
        return '0.00'; // If no kills but deaths exist, return "0.00"
    }
    // Normal case: calculate and return K/D
    return (kills / deaths).toFixed(2);
}

function calculateAverageRank(team: any[]): string {
    const totalRank = team.reduce((sum: number, player: any) => {
        const rankId = player.current_rank_id;
        return sum + (rankId ? rankId : 0); // Summing up the rank IDs
    }, 0);
    
    const averageRankId = Math.round(totalRank / team.length); // Calculate average rank
    const rankData = rankMapping[averageRankId.toString() as keyof typeof rankMapping]; // Lookup average rank in rankMapping
    return rankData ? `${rankData.emoji} ${rankData.name}` : "Unknown Rank"; // Return the emoji and name
}

function calculateMVP(team: any[]): { name: string; kills: number; deaths: number; kd: string } | null {
    if (!team || team.length === 0) return null;

    return team.reduce((mvp, player) => {
        if (
            player.num_kills > mvp.kills ||
            (player.num_kills === mvp.kills && parseFloat(calculateKD(player.num_kills, player.num_deaths)) > parseFloat(mvp.kd))
        ) {
            return {
                name: player.saved_player_name,
                kills: player.num_kills,
                deaths: player.num_deaths,
                kd: calculateKD(player.num_kills, player.num_deaths),
            };
        }
        return mvp;
    }, { name: '', kills: 0, deaths: 0, kd: '0.00' });
}
const config: SlashCommandConfig = {
    name: "matchinfo",
    description: "Fetch the match details and team lineup.",
    usage: "/matchinfo",
    options: [
        {
            name: "matchid",
            description: "The ID of the match",
            type: "STRING",
            required: true,
        },
    ],
};

const mapImages: { [key: string]: string } = {
    Commons: 'https://santai.gg/images/map-previews/Commons_800x800.webp',
    Metro: 'https://santai.gg/images/map-previews/Metro_800x800.webp',
    Junction: 'https://santai.gg/images/map-previews/Skyway_800x800.webp',
    Greenbelt: 'https://santai.gg/images/map-previews/Mill_800x800.webp',
};

const command: SlashCommand = {
    execute: async (interaction) => {
        const matchId = interaction.options.get("matchid")?.value as string;

        try {
            // Acknowledge the interaction immediately to prevent timeout
            await interaction.deferReply();

            // Fetch match details from the API
            const response = await axios.get(
                `https://wavescan-production.up.railway.app/api/v1/match/${matchId}/check`
            );

            const { success, game_service_response } = response.data;

            // Check if the API response is successful
            if (!success) {
                await interaction.editReply(`🚧 Failed to fetch match details for match ${matchId}. 🚧`);
                return;
            }

            const match = game_service_response.spectre_match;
            const teams = game_service_response.spectre_match_team;

            // Ensure match and teams data exist before accessing it
            if (!match || !teams || teams.length < 2) {
                await interaction.editReply(`🚧 Invalid match data or team structure for match ${matchId}. 🚧`);
                return;
            }


            // Prepare data for teams and their players
            const getTeamData = (team: any[]) => {
                const mvp = calculateMVP(team); // Find the MVP
                return team.map((player: any) => {
                    const kills = player.num_kills || 0;
                    const deaths = player.num_deaths || 0;
                    const kd = calculateKD(kills, deaths); // Pre-calculate K/D ratio
                    const rankId = player.current_rank_id; // Get the current rank ID
                    const rankData = rankMapping[rankId.toString() as keyof typeof rankMapping]; // Look up the rank in rankMapping.json
                    const rankName = rankData ? rankData.name : "Unknown"; // Default to "Unknown" if no rank found
                    const rankEmoji = rankData ? rankData.emoji : "";
                    console.log(`${player.saved_player_name}'s currentRankId: ${rankId} - Rank: ${rankName} ${rankEmoji}`);
            
                    // Add ✪ in front of the MVP's name
                    const name = mvp && player.saved_player_name === mvp.name
                        ? `✪ ${player.saved_player_name} - ${rankEmoji}`
                        : `${player.saved_player_name} - ${rankEmoji}`;
            
                    return {
                        name,
                        kills,
                        deaths,
                        kd,
                    };

                    
                });
            };
            const team1 = getTeamData(teams[0]?.players || []);
            const team2 = getTeamData(teams[1]?.players || []);
            // Format the team data for display, including K/D below the names
            const team1List = team1.length > 0
                ? team1.map((player: any) => `> ${player.name}\n↳ K/D: ${player.kd}`).join("\n\n")
                : "No players found";

            const team2List = team2.length > 0
                ? team2.map((player: any) => `> ${player.name}\n↳ K/D: ${player.kd}`).join("\n\n")
                : "No players found";

            // Get the game mode, map, and region, with a default fallback
            const gameMode = match.queue_game_mode || "Unknown Game Mode";
            const mapName = match.queue_game_map || "Unknown Map";
            const region = match.region || "Unknown Region";

            // Normalize map name to handle suffixes like '_P'
            const normalizedMapName = mapName.replace('_P', ''); // Removing '_P' suffix
            const mapImageUrl = mapImages[normalizedMapName] || null;

            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle(`Match Info for Match ID: ${matchId}`)
                .addFields(
                    { name: "🕹️ Game Mode", value: gameMode, inline: true },
                    { name: "🌎 Region", value: region, inline: true },
                    { name: "🗺️ Map", value: normalizedMapName, inline: true },
                    { name: "👥 Team 1 (Blue Team)", value: team1List || "No players found", inline: true },
                    { name: "👥 Team 2 (Red Team)", value: team2List || "No players found", inline: true }
                )
                .setImage(mapImageUrl || "")
                .setFooter({
                    text: "Match details powered by Santai.GG",
                    iconURL: "https://barronbucket.nyc3.digitaloceanspaces.com/screenshot/85729/Spectre_Divide_Puck_White.png"
                })
                .setTimestamp();
                await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error(`Failed to fetch match details for match ${matchId}:`, error);
            await interaction.followUp(`🚧 There was an error fetching the match details for match ${matchId}. 🚧`);
        }
    },
};

export default { command, config };