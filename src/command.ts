import {
    SlashCommandBuilder,
    SlashCommandSubCommmandsOnlyBuilder,
    CommandInteraction
} from 'discord.js'

export interface Command {
    data: SlashCommandBuilder | SlashCommandSubCommandsOnlyBuilder
    run: (interaction)
}