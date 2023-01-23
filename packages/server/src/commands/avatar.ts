import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'

import { getHabiticaUserAvatar } from '~/utils/avatar.js'
import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'

export const avatarCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Commands related to your Habitica avatar')
		.addSubcommand((subcommand) =>
			subcommand.setName('update').setDescription('Update your cached avatar')
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('delete')
				.setDescription('Delete your avatar (uses Discord avatar instead)')
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand()
		if (subcommand === 'delete') {
			const prisma = await getPrisma()
			await prisma.user.update({
				data: {
					habiticaUser: {
						update: {
							cachedAvatarBase64: null,
						},
					},
				},
				where: {
					discordUserId: interaction.user.id,
				},
			})

			await interaction.reply({
				content: 'Habitica Avatar successfully deleted!',
				ephemeral: true,
			})
		} else {
			const prisma = await getPrisma()
			const { habiticaUser } = await prisma.user.findFirstOrThrow({
				select: {
					habiticaUser: {
						select: {
							id: true,
							apiToken: true,
							name: true,
							username: true,
						},
					},
				},
				where: {
					discordUserId: interaction.user.id,
				},
			})

			if (habiticaUser === null) {
				throw new Error('User does not have a linked Habitica account')
			}

			await interaction.deferReply({
				ephemeral: true,
			})
			const avatarBuffer = await getHabiticaUserAvatar({
				habiticaApiToken: habiticaUser.apiToken,
				habiticaUserId: habiticaUser.id,
				force: true,
			})
			await interaction.editReply({
				content: `Habitica avatar successfully updated!`,
				files: [
					new AttachmentBuilder(avatarBuffer, {
						name: 'avatar.jpeg',
					}),
				],
			})
		}
	},
})
