import { Client, GatewayIntentBits } from 'discord.js'
import onetime from 'onetime'

export const getDiscordClient = onetime(() => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
		],
	})

	return client
})
