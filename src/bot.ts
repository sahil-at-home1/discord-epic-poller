import { GatewayIntentBits } from 'discord.js';
import MyClient from './myClient.js'
import { ClientReadyEvent } from './events/ready.js'
import { InteractionCreateEvent } from './events/interactionCreate.js'
import { Ping } from './commands/ping.js'

require('dotenv').config();

// create a new client instance
const client: MyClient = new MyClient({ intents: [GatewayIntentBits.Guilds] });

// get the commands and add to collection
client.commands.set(Ping.data.name, Ping)

// get the event handlers and add to client
client.once(ClientReadyEvent.name, (...args) => ClientReadyEvent.execute(...args))
client.on(InteractionCreateEvent.name, (...args) => InteractionCreateEvent.execute(...args))

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);