import { CommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from "discord.js"

export const Poll = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('Poll')
        .setDescription('Sets up a new poll')
        .addStringOption((option) =>
            option.setName('title')
                .setDescription('Title of the poll')
                .setRequired(true)
                .setMaxLength(100)
        ),
    execute: async (interaction: CommandInteraction) => {
        await interaction.deferReply({
            ephemeral: true
        })
        await interaction.reply(`your title was `)
    }
}