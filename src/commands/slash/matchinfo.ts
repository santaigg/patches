import { SlashCommand, SlashCommandConfig } from "@/types/command";
import axios from "axios";
import { EmbedBuilder } from "discord.js";

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

const config: SlashCommandConfig = {
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

const mapImages = {
    Commons: 'https://media.discordapp.net/attachments/1134593601427476561/1280601517325291592/LoadingScreen_Commons.png',
    Metro_P: 'https://media.discordapp.net/attachments/1134593601427476561/1269354484673282109/metro-4k.png',
    Junction_P: 'https://media.discordapp.net/attachments/1134593601427476561/1269354324430159912/skyway-4k.png',
    Greenbelt_P: 'https://media.discordapp.net/attachments/1134593601427476561/1269354223233929287/mill-4k.png',
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

            // Log for debugging: check the player data for each team
            console.log("Team Data:", teams);

            // Prepare data for teams and their players
            const getTeamData = (team: any[]) => {
                return team.map((player: any) => {
                    const kills = player.num_kills || 0;
                    const deaths = player.num_deaths || 0;
                    const kd = calculateKD(kills, deaths); // Pre-calculate K/D ratio

                    // Log player stats for debugging
                    console.log(`Player: ${player.saved_player_name}, Kills: ${kills}, Deaths: ${deaths}, K/D: ${kd}`);

                    return {
                        name: player.saved_player_name,
                        kills,
                        deaths,
                        kd,
                    };
                });
            };

            const team1 = getTeamData(teams[0]?.players || []);
            const team2 = getTeamData(teams[1]?.players || []);

            // Format the team data for display, including K/D below the names
            const team1List = team1.length > 0 ? team1.map((player: any) => `> ${player.name}\n↳ K/D: ${player.kd}`).join("\n\n") : "No players found";
            const team2List = team2.length > 0 ? team2.map((player: any) => `> ${player.name}\n↳ K/D: ${player.kd}`).join("\n\n") : "No players found";

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
                    { name: "Game Mode", value: gameMode, inline: false },
                    { name: "Region", value: region, inline: false },
                    { name: "Team 1", value: team1List, inline: true },
                    { name: "Team 2", value: team2List, inline: true },
                );

            // Only set image if a valid URL exists
            if (mapImageUrl) {
                embed.setImage(mapImageUrl);
            }

            embed.setTimestamp()
                .setFooter({ text: "Spectre Divide Bot", iconURL: "https://i.imgur.com/wSTFkRM.png" });

            // Send the embed with the match info
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to fetch match details for match ${matchId}:`, error);
            await interaction.followUp(`🚧 There was an error fetching the match details for match ${matchId}. 🚧`);
        }
    },
};

export default { command, config };
