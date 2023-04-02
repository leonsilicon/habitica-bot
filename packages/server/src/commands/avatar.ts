import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'

import {
	getHabiticaUserAvatarWithFallback,
	updateHabiticaUserAvatar,
} from '~/utils/avatar.js'
import { defineSlashCommand } from '~/utils/command.js'
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
				await prisma.appUser.update({
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
				const { habiticaUser } = await prisma.appUser.findFirstOrThrow({
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
				const avatarBuffer = await updateHabiticaUserAvatar({
					habiticaApiToken: habiticaUser.apiToken,
					habiticaUserId: habiticaUser.id,
					animated,
				})
				await interaction.editReply({
					content: `Habitica avatar successfully updated!`,
					files: [
						new AttachmentBuilder(avatarBuffer, {
							name: animated ? 'avatar.gif' : 'avatar.jpeg',
						}),
					],
				})
				break
			}

			case 'view': {
				const prisma = await getPrisma()
				const { habiticaUser } = await prisma.appUser.findFirstOrThrow({
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

				const avatar = await getHabiticaUserAvatarWithFallback({
					discordUserId: interaction.user.id,
				})
				if ('url' in avatar) {
					await interaction.reply({
						content: avatar.url,
					})
				} else {
					await interaction.reply({
						content: `${habiticaUser.name} (@${habiticaUser.username})'s Avatar`,
						files: [
							new AttachmentBuilder(avatar.data, {
								name: avatar.isAnimated ? 'avatar.gif' : 'avatar.jpeg',
							}),
						],
					})
				}

				break
			}

			default: {
				throw new Error('Unknown avatar subcommand')
			}
		}
	},
})
