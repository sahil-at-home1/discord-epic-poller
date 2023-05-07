import { ActionRowBuilder, BaseSelectMenuBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuOptionBuilder } from "discord.js"

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
        // immediate reply
        const title: string = interaction.options.get('title')?.value as string ?? 'Untitled Poll'
        await interaction.deferReply({
            ephemeral: true
        })
        await interaction.reply(`your title was ${title}`)

        // creating the poll selections
        const poll = new StringSelectMenuBuilder()
            .setCustomId('poll')
            .setPlaceholder('Choose from the following...')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('Option 1')
                    .setDescription('Description')
                    .setValue('option1'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Option 2')
                    .setDescription('Description')
                    .setValue('option2'),
            ])

        const row1 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents()

        // create a button to end the poll
        const endPoll = new ButtonBuilder()
            .setCustomId('end')
            .setLabel('End Poll')
            .setStyle(ButtonStyle.Danger)

        const row2 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(endPoll)

        // send the message
        await interaction.reply({
            components: [row1, row2]
        })

    }
}