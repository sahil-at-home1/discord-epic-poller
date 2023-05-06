import {
    SlashCommandBuilder,
    CommandInteraction
} from 'discord.js'

export interface Command {
    data: SlashCommandBuilder,
    run: (interaction: CommandInteraction) => Promise<void>
}