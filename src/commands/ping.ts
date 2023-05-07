import { SlashCommandBuilder } from "discord.js";

export const Ping = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    execute: async (interaction: any) => {
        await interaction.reply('Pong!')
    }
} 