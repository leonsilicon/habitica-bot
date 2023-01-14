import { SlashCommandBuilder } from 'discord.js'
import { nanoid } from 'nanoid-nice'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { getHabiticaUser } from '~/utils/habitica.js'
import { getPrisma } from '~/utils/prisma.js'

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

		const { auth, profile } = await getHabiticaUser({
			habiticaApiToken,
			habiticaUserId,
		})
		const prisma = await getPrisma()
		await prisma.user.create({
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
				discordUserId: interaction.user.id,
			},
		})

		await interaction.reply({
			content: `Successfully linked Habitica account ${profile.name} (@${auth.local.username})!`,
		})
	},
})
