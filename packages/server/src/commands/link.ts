import { SlashCommandBuilder } from 'discord.js'
import { nanoid } from 'nanoid-nice'
import { outdent } from 'outdent'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { gotHabitica } from '~/utils/habitica.js'
import { getPrisma } from '~/utils/prisma.js'
import { habiticaBotWebhookUrl } from '~/utils/webhook.js'

export const linkCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Link your Habitica account')
		.addStringOption((option) =>
			option
				.setName('user_id')
				.setDescription(
					'Your Habitica User ID (can be found at https://habitica.com/user/settings/api)'
				)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('api_token')
				.setDescription(
					'Your Habitica API Token (can be found at https://habitica.com/user/settings/api)'
				)
				.setRequired(true)
		),
	async execute(interaction) {
		const habiticaUserId = interaction.options.getString('user_id')
		invariant(habiticaUserId !== null)
		const habiticaApiToken = interaction.options.getString('api_token')
		invariant(habiticaApiToken !== null)

		const habiticaUser = {
			id: habiticaApiToken,
			apiToken: habiticaApiToken,
		}

		const { auth, profile } = await gotHabitica('GET /api/v3/user', {
			habiticaUser,
		})
		const prisma = await getPrisma()
		await prisma.appUser.create({
			data: {
				id: nanoid(),
				habiticaUser: {
					create: {
						id: habiticaUserId,
						name: profile.name,
						username: auth.local.username,
						apiToken: habiticaApiToken,
					},
				},
				habiticaUserId,
				areTasksPublic: false,
				discordUserId: interaction.user.id,
			},
		})

		const webhooks = await gotHabitica('GET /api/v3/user/webhook', {
			habiticaUser,
		})

		const habiticaBotWebhook = webhooks.find(
			(webhook) => webhook.url === habiticaBotWebhookUrl
		)
		if (habiticaBotWebhook === undefined) {
			await gotHabitica('POST /api/v3/user/webhook', {
				habiticaUser,
				body: {
					url: habiticaBotWebhookUrl,
				},
			})
		} else {
			if (!habiticaBotWebhook.enabled) {
				await gotHabitica('PUT /api/v3/user/webhook/:id', {
					habiticaUser,
					body: {
						enabled: true,
					},
				})
			}
		}

		invariant(interaction.channel !== null)
		await interaction.reply({
			content: outdent`
				Successfully linked your Habitica account ${profile.name} (@${auth.local.username})!

				**Note:** in order for task notifications to appear, you need to run \`/settings public_tasks True\`
			`,
		})
	},
})
