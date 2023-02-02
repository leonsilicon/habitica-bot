import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'

import { getHabiticaUserAvatar } from '~/utils/avatar.js'
import { defineSlashCommand } from '~/utils/command.js'
import { getHabiticaEmbedThumbnail } from '~/utils/embed.js'
import { getPrisma } from '~/utils/prisma.js'

export const avatarCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Commands related to your Habitica avatar')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('update')
				.setDescription('Update your cached avatar')
				.addBooleanOption((option) =>
					option
						.setName('animated')
						.setDescription('Whether or not your avatar is animated')
						.setRequired(false)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('delete')
				.setDescription('Delete your avatar (uses Discord avatar instead)')
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('view').setDescription('View your avatar')
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand()
		switch (subcommand) {
			case 'delete': {
				const prisma = await getPrisma()
				await prisma.user.update({
					data: {
						habiticaUser: {
							update: {
								avatar: {
									delete: true,
								},
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
				break
			}

			case 'update': {
				const animated = interaction.options.getBoolean('animated') ?? false
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
				const avatar = await getHabiticaUserAvatar({
					habiticaApiToken: habiticaUser.apiToken,
					habiticaUserId: habiticaUser.id,
					animated,
					force: true,
				})
				await interaction.editReply({
					content: `Habitica avatar successfully updated!`,
					files: [
						new AttachmentBuilder(avatar.data, {
							name: avatar.isAnimated ? 'avatar.gif' : 'avatar.jpeg',
						}),
					],
				})
				break
			}

			case 'view': {
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

				const { files } = await getHabiticaEmbedThumbnail({
					discordUserId: interaction.user.id,
					habiticaUserId: habiticaUser.id,
				})

				await interaction.reply({ files })
				break
			}

			default: {
				throw new Error('Unknown avatar subcommand')
			}
		}
	},
})
