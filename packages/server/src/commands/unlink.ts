import { SlashCommandBuilder } from 'discord.js'

import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'

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
						name: true,
						username: true,
					},
				},
			},
			where: {
				discordUserId: interaction.user.id,
			},
		})

		await interaction.reply({
			ephemeral: true,
			content: `Successfully unlinked Habitica account ${user.habiticaUser.name} (@${user.habiticaUser.username}).`,
		})
	},
})
