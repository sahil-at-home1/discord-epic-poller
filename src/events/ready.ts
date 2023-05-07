import { Client, Events } from 'discord.js'

export const onReady = {
    name: Events.ClientReady as string,
    once: true,
    execute: async (client: Client) => {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
    }
}

