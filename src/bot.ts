import fs from 'node:fs'
import path from 'node:path'
import { Client, Interaction, ClientOptions, Collection, Events, GatewayIntentBits } from 'discord.js';

// extending to add commands collection
class MyClient extends Client {
    commands: Collection<string, any>

    constructor(options: ClientOptions) {
        super(options)
        this.commands = new Collection()
    }
}

require('dotenv').config();

// create a new client instance
const client: MyClient = new MyClient({ intents: [GatewayIntentBits.Guilds] });

// get the commands and add to collection
const commandsPath: string = path.join(__dirname, 'commands')
const commandFiles: string[] = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'))
for (const file of commandFiles) {
    const filePath: string = path.join(commandsPath, file)
    const command = require(filePath)
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
    } else {
        console.log('bad command file path')
    }
}

client.on(Events.InteractionCreate, (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
        return
    }
    console.log(interaction)
})

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c: any) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);