import path from 'node:path'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import { ChannelType, EmbedBuilder, Events, REST, Routes } from 'discord.js'
import dotenv from 'dotenv'
import { fastify } from 'fastify'
import { getProjectDir } from 'lion-utils'
import invariant from 'tiny-invariant'

import * as slashCommandsExports from '~/commands/index.js'
import { type SlashCommand } from '~/types/command.js'
import { type HabiticaRequest } from '~/types/habitica.js'
import { getDiscordClient } from '~/utils/discord.js'
import { getPrisma } from '~/utils/prisma.js'

const slashCommandsMap = Object.fromEntries(
	Object.values(slashCommandsExports).map((slashCommandExport) => [
		slashCommandExport.data.name,
		slashCommandExport,
	])
) as Record<string, SlashCommand>

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.tz.setDefault('America/Toronto')

const monorepoDir = getProjectDir(import.meta.url, { monorepoRoot: true })

console.log(monorepoDir)
dotenv.config({ path: path.join(monorepoDir, '.env') })

const applicationId = '1061301445544128624'
const guildId = '1061299980792496199'

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!)

const commandsJson = Object.values(slashCommandsMap).map((command) => {
	invariant(command.data.toJSON !== undefined)
	return command.data.toJSON()
})

const data = await rest.put(
	Routes.applicationGuildCommands(applicationId, guildId),
	{
		body: commandsJson,
	}
)

console.log(
	`Successfully reloaded ${
		(data as { length: number }).length
	} application (/) commands.`
)

const client = getDiscordClient()

client.once(Events.ClientReady, (client) => {
	console.log(`Logged in as ${client.user.tag}`)
})

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return
	const command = slashCommandsMap[interaction.commandName]
	if (command === undefined) return

	try {
		await command.execute(interaction)
	} catch (error: unknown) {
		console.error('Slash command failed:', error)
	}
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

app.post('/webhook', async (request, reply) => {
	console.log('Webhook called with:', request.body)
	const data = request.body as HabiticaRequest
	const { task } = data

	const prisma = await getPrisma()
	const user = await prisma.user.findUniqueOrThrow({
		select: {
			discordUserId: true,
			habiticaUser: {
				select: {
					name: true,
				},
			},
		},
		where: {
			habiticaUserId: data.user._id,
		},
	})

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
				value: user.habiticaUser.name,
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
			content: `<@${user.discordUserId}>, please send proof of completion for your task _${task.text}_ (${proofDescription})`,
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
