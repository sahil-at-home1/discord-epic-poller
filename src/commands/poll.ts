import { ActionRowBuilder, bold, BaseSelectMenuBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder } from "discord.js"

export const Poll = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Sets up a new poll')
        .addStringOption((option) =>
            option.setName('title')
                .setDescription('Title of the poll')
                .setRequired(true)
                .setMaxLength(100)
        ),
    execute: async (interaction: CommandInteraction) => {
        // immediate reply
        await interaction.deferReply({
            ephemeral: true
        })
        // await interaction.reply(`your title was ${title}`)
        const title: string = bold(interaction.options.get('title')?.value as string ?? 'Untitled Poll')
        // const title_row = new ActionRowBuilder<Text>

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
        const select_row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(poll)

        // send the message
        const response = await interaction.followUp({
            content: `${title}`,
            components: [select_row]
        })

        // handle the response 
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 3_600_000
        })
        collector.on('collect', async i => {
            const selection = i.values[0]
            await interaction.editReply(`${i.user} has selected ${selection}`)
        })


    }
}