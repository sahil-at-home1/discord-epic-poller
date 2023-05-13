import { User, APIEmbedField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js'
import { Mutex } from 'async-mutex'

export class PollItem {
    readonly title: string
    votes: number
    voters: string[]
    mutex: Mutex = new Mutex()

    constructor(title: string, value: string) {
        this.title = title
        this.votes = 0
        this.voters = []
    }

    async addVote(voter: string): Promise<void> {
        await this.mutex.runExclusive(() => {
            if (this.voters.includes(voter)) {
                console.error(`(${this.title}) addVote: voter already voted for this item`)
                return
            }
            this.votes += 1
            this.voters.push(voter)
            console.log(`(${this.title}) addVote: ${this.toString()}`)
        })
    }

    async removeVote(voter: string): Promise<void> {
        await this.mutex.runExclusive(() => {
            if (!this.voters.includes(voter)) {
                console.error(`(${this.title}) removeVote: voter did not vote for this item`)
                return
            }
            this.votes -= 1
            this.voters = this.voters.filter(v => v !== voter)
            console.log(`(${this.title}) removeVote: ${this.toString()}`)
        })
    }

    toString(): string {
        return `${this.title} ${this.votes} ${this.voters.toString()}`
    }
}

export class PollItemList {
    title: string = ''
    items: Map<string, PollItem> = new Map() // maps title to item
    voters: Map<string, string> = new Map() // maps voter to title of voted item
    length: number = 0
    mutex: Mutex = new Mutex()

    constructor(title: string) {
        this.title = title
    }

    async vote(title: string, voter: User): Promise<void> {
        // check if item is valid
        const currItem: PollItem | undefined = this.items.get(title)
        if (currItem == undefined) {
            console.error(`(${this.title}) vote: ${title} not a valid pollItem value`)
            return
        }
        const voterStr: string = voter.toString()
        // check if voter already voted and remove their previous vote atomically
        await this.mutex.runExclusive(async () => {
            // check if voter voted previously
            const prevItemTitle: string | undefined = this.voters.get(voterStr)
            if (prevItemTitle != undefined) {
                // check if voter voted for this item previously
                if (prevItemTitle == currItem.title) {
                    console.log(`(${this.title}) vote: ${voter.username} already voted for ${currItem.title}`)
                    return
                }
                const prevItem: PollItem | undefined = this.items.get(prevItemTitle)
                if (prevItem == undefined) {
                    console.log(`(${this.title}) vote: previous item ${prevItem} was not valid`)
                    this.voters.delete(voterStr)
                } else {
                    console.log(`(${this.title}) vote: ${voter.username} previously voted for ${prevItemTitle}`)
                    await prevItem.removeVote(voterStr)
                }
            }
            console.log(`(${this.title}) vote: ${voter.username} voted for ${currItem.title}\n`)
            // update state of poll item
            this.voters.set(voterStr, title)
            await currItem.addVote(voterStr)
        })
    }

    add(title: string): boolean {
        if (this.items.get(title) != null) {
            console.log(`(${this.title}) ${title} already in poll items`)
            return false
        }
        const item = new PollItem(title, String(this.length))
        this.items.set(item.title, item)
        this.length += 1
        return true
    }

    delete(title: string): boolean {
        if (this.items.get(title) == null) {
            console.log(`(${this.title}) ${title} not in poll items`)
            return false
        }
        this.items.delete(title)
        this.length -= 1
        return true
    }

    toEmbedFields(): APIEmbedField[] {
        let fields: APIEmbedField[] = []
        this.items.forEach((i: any) => {
            let voteMsg = 'Votes'
            if (i.votes == 1) {
                voteMsg = 'Vote'
            }
            fields.push({
                name: i.title,
                value: `${i.votes} ${voteMsg} ${i.voters.toString()}`
            })
        })
        return fields
    }

    toStringSelectMenuOptions(): StringSelectMenuOptionBuilder[] {
        let options: StringSelectMenuOptionBuilder[] = []
        this.items.forEach((i: PollItem) => {
            options.push(new StringSelectMenuOptionBuilder()
                .setLabel(i.title)
                .setValue(i.title)
            )
        })
        return options
    }

    toString(): string {
        return Array.from(this.items.values())
            .map((item) => `- ${item.title}`)
            .join('\r\n')
    }
}