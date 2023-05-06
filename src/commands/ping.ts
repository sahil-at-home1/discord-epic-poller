import { Command } from '../command.js'
import { SlashCommandBuilder } from "discord.js";


const PingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!')

const PingCommandExecutor = async (interaction: any) => {
    await interaction.reply('Pong!')
}

export default {
    data: PingCommand,
    run: PingCommandExecutor
}