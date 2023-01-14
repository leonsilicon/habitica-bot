import { SlashCommandBuilder } from 'discord.js'

import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'

export const linkCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Link your Habitica account')
		.addStringOption((option) =>
			option
				.setName('User ID')
				.setDescription(
					'Your Habitica User ID (can be found at https://habitica.com/user/settings/api)'
				)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('API Token')
				.setDescription(
					'Your Habitica API Token (can be found at https://habitica.com/user/settings/api)'
				)
				.setRequired(true)
		),
	async execute(interaction) {
		const prisma = await getPrisma()
		const habiticaUserId = interaction.options.getString('User ID')
		const habiticaApiToken = interaction.options.getString('User ID')

		await prisma.user.create({
			data: {
				discordUserId: interaction.user.id,
				habiticaUserId,
				habiticaApiToken,
			},
		})
	},
})
