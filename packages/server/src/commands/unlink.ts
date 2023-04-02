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
		const appUser = await prisma.appUser.delete({
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

		if (appUser.habiticaUser === null) {
			invariant(interaction.channel !== null)
			await interaction.reply({
				content: `Successfully unlinked Habitica account!`,
			})
			return
		}

		const webhooks = await gotHabitica('GET /api/v3/user/webhook', {
			habiticaUser: appUser.habiticaUser,
		})
		const habiticaBotWebhookId = webhooks.find(
			(webhook) => webhook.url === habiticaBotWebhookUrl
		)?.id

		if (habiticaBotWebhookId !== undefined) {
			await gotHabitica('DELETE /api/v3/user/webhook/:id', {
				habiticaUser: appUser.habiticaUser,
				pathParams: {
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
