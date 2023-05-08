import { ActionRowBuilder, BaseSelectMenuBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js"

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
        const title: string = interaction.options.get('title')?.value as string ?? 'Untitled Poll'
        await interaction.deferReply({
            ephemeral: true
        })
        // await interaction.reply(`your title was ${title}`)

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

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(poll)

        // send the message
        const response = await interaction.followUp({
            components: [row]
        })

        // handle the response 
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 3_600_000
        })

        collector.on('collect', async i => {
            const selection = i.values[0]
            await i.reply(`${i.user} has selected ${selection}`)
        })


    }
}