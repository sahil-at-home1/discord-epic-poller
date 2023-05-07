import { Client, ClientOptions, Collection } from 'discord.js'

// extending to add commands collection
class MyClient extends Client {
    commands: Collection<string, any>

    constructor(options: ClientOptions) {
        super(options)
        this.commands = new Collection()
    }
}

export default MyClient