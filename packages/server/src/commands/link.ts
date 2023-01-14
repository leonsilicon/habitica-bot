import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { createUser } from '~/utils/habitica.js'

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
		const habiticaUserId = interaction.options.getString('User ID')
		invariant(habiticaUserId !== null)
		const habiticaApiToken = interaction.options.getString('User ID')
		invariant(habiticaApiToken !== null)

		await createUser({
			discordUserId: interaction.user.id,
			habiticaApiToken,
			habiticaUserId,
		})
	},
})
