import path from 'node:path'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import {
	ChannelType,
	Client,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
} from 'discord.js'
import dotenv from 'dotenv'
import { fastify } from 'fastify'
import { getProjectDir } from 'lion-utils'
import invariant from 'tiny-invariant'

import { type HabiticaRequest } from '~/types/habitica.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.tz.setDefault('America/Toronto')

const monorepoDir = getProjectDir(import.meta.url, { monorepoRoot: true })

console.log(monorepoDir)
dotenv.config({ path: path.join(monorepoDir, '.env') })

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
})

client.once(Events.ClientReady, (client) => {
	console.log(`Logged in as ${client.user.tag}`)
})

client.on(Events.MessageCreate, async (message) => {
	const repliedTo = message.reference?.messageId
	if (repliedTo === undefined) {
		return
	}

	const needsProofMessage = await message.channel.messages.fetch(repliedTo)
	const embed = needsProofMessage.embeds[0]
	if (embed === undefined) {
		return
	}

	const newEmbed = EmbedBuilder.from(embed)
	newEmbed.setColor('Green')
	newEmbed.addFields({
		name: 'Proof',
		value: message.url,
	})

	await needsProofMessage.edit({
		embeds: [newEmbed],
	})
})

const app = fastify()

const notificationsChannelId = '1061299980792496202'

const habiticaUserDataMap: Record<string, { discordId: string; name: string }> =
	{
		'984c33a5-7b36-478d-8e89-d8159fbafd95': {
			name: 'Leon Si',
			discordId: '1022267596382408755',
		},
		'kevins habitica id': {
			name: 'Kevin Xu',
			discordId: '723922029644087378',
		},
	}

app.post('/webhook', async (request, reply) => {
	console.log('Webhook called with:', request.body)
	const data = request.body as HabiticaRequest
	const { task } = data

	const habiticaUserData = habiticaUserDataMap[data.user._id]
	if (habiticaUserData === undefined) {
		console.error(`Discord ID for Habitica user ${data.user._id} not found.`)
		return reply.status(400)
	}

	const { discordId, name } = habiticaUserData

	let title: string
	let description: string
	if (data.direction === 'up') {
		title = 'Task Completed'
		description = 'A task has been checked off!'
	} else {
		title = 'Task Undone'
		description = 'A task has been unchecked!'
	}

	const doesTaskNeedProof =
		/\*\*Needs Proof:\*\* (.*)/.test(task.notes) && data.direction === 'up'
	const embed = new EmbedBuilder()
		.setColor(doesTaskNeedProof ? 'Orange' : 'Green')
		.setTitle(title)
		.setDescription(description)
		.addFields(
			{
				name: 'User',
				value: name,
			},
			{
				name: 'Task Name',
				value: task.text,
			},
			{
				name: 'Task Notes',
				value: task.notes,
			},
			{
				name: 'Date',
				value: dayjs().tz().format('LLL'),
			}
		)

	const notificationsChannel = await client.channels.fetch(
		notificationsChannelId
	)
	invariant(notificationsChannel?.type === ChannelType.GuildText)

	if (doesTaskNeedProof) {
		const proofDescription = /\*\*Needs Proof:\*\* (.*)/.exec(task.notes)?.[1]
		invariant(proofDescription !== undefined, 'missing proof item')
		const notificationsChannel = await client.channels.fetch(
			notificationsChannelId
		)
		invariant(notificationsChannel?.type === ChannelType.GuildText)
		console.log('sending proof message')
		await notificationsChannel.send({
			embeds: [embed],
			content: `<@${discordId}>, please send proof of completion for your task _${task.text}_ (${proofDescription})`,
		})
	} else {
		await notificationsChannel.send({
			embeds: [embed],
		})
	}

	console.debug('Webhook finished!')
	void reply.status(200)
})

app.listen({ port: 3000 }, (err, address) => {
	console.info(`Server listening on ${address}`)
})

invariant(process.env.DISCORD_TOKEN !== undefined)
await client.login(process.env.DISCORD_TOKEN)
