import { SlashCommand, SlashCommandConfig } from "@/types/command"

const config: SlashCommandConfig = {
  name: "compfeedback",
  description: "Anonymously submit feedback for future SantaiGG tournaments.",
  usage: "/compfeedback",
  options: [
    {
      name: "feedback",
      description: "The feedback to submit",
      type: "STRING",
      required: true,
    },
  ],
}

const command: SlashCommand = {
  // permissions: 0,
  execute: async (interaction) => {
    const feedback = interaction.options.get("feedback")?.value as string

    // Send feedback to the 1314298929944461362 channel
    const channel = await interaction.client.channels.fetch("1314298929944461362")
    if (channel && channel.isTextBased() && 'send' in channel) {
      await channel.send(`Anonymous feedback: ${feedback}`)
    }

    await interaction.reply({
      content: `Thank you for your feedback!`,
      ephemeral: true
    })
  },
}

export default { command, config }
