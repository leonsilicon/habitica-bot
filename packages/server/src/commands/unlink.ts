import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { gotHabitica } from '~/utils/habitica.js'
import { getPrisma } from '~/utils/prisma.js'
import { habiticaBotWebhookUrl } from '~/utils/webhook.js'

export const unlinkCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('unlink')
		.setDescription('Unlink your Habitica account'),
	async execute(interaction) {
		const prisma = await getPrisma()
		const user = await prisma.user.delete({
			select: {
				habiticaUser: {
					select: {
						apiToken: true,
						id: true,
						name: true,
						username: true,
					},
				},
			},
			where: {
				discordUserId: interaction.user.id,
			},
		})

		if (user.habiticaUser === null) {
			invariant(interaction.channel !== null)
			await interaction.reply({
				content: `Successfully unlinked Habitica account!`,
			})
			return
		}

		const webhooks = await gotHabitica('GET /api/v3/user/webhook', {
			apiToken: user.habiticaUser.apiToken,
			userId: user.habiticaUser.id,
		})
		const habiticaBotWebhookId = webhooks.find(
			(webhook) => webhook.url === habiticaBotWebhookUrl
		)?.id

		if (habiticaBotWebhookId !== undefined) {
			await gotHabitica('DELETE /api/v3/user/webhook/:id', {
				apiToken: user.habiticaUser.apiToken,
				userId: user.habiticaUser.id,
				params: {
					id: habiticaBotWebhookId,
				},
			})
		}

		invariant(interaction.channel !== null)
		await interaction.reply({
			content: `<@${interaction.user.id}> successfully unlinked their Habitica account.`,
		})
	},
})
