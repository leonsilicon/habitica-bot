import { type BaseMessageOptions, EmbedBuilder } from 'discord.js'
import pluralize from 'pluralize'
import invariant from 'tiny-invariant'

import { getHabiticaEmbedThumbnail } from '~/utils/embed.js'
import { gotHabitica } from '~/utils/habitica.js'
import { getPrisma } from '~/utils/prisma.js'

export function isTaskPublic(task: { notes: string }) {
	const notes = task.notes.toLowerCase()
	return !notes.includes('hidden') && !notes.includes('private')
}

export async function getPublicTasks({ userId }: { userId: string }) {
	const prisma = await getPrisma()
	const user = await prisma.user.findUniqueOrThrow({
		select: {
			habiticaUser: {
				select: {
					apiToken: true,
					id: true,
				},
			},
		},
		where: {
			id: userId,
		},
	})
	if (user.habiticaUser === null) {
		throw new Error('User not linked to habitica account')
	}

	const allTasks = await gotHabitica('GET /api/v3/tasks/user', {
		apiToken: user.habiticaUser.apiToken,
		userId: user.habiticaUser.id,
	})
	const publicTasks = allTasks.filter((task) => isTaskPublic(task))

	return publicTasks
}

export async function createTasksSummaryMessage({
	userId,
	taskType,
}: {
	userId: string
	taskType: 'habit' | 'todo' | 'daily'
}): Promise<BaseMessageOptions> {
	const prisma = await getPrisma()
	const user = await prisma.user.findFirstOrThrow({
		select: {
			habiticaUser: {
				select: {
					id: true,
					name: true,
					username: true,
					apiToken: true,
				},
			},
			discordUserId: true,
		},
		where: {
			id: userId,
		},
	})

	invariant(user.habiticaUser !== null)

	const publicTasks = await getPublicTasks({
		userId,
	})

	const tasksSummary = publicTasks
		.filter((task) => task.type === taskType)
		.map(
			(task) =>
				`${task.completed ? ':white_check_mark:' : ':white_large_square:'} ${
					task.text
				}`
		)
		.join('\n')

	const { files, thumbnail } = await getHabiticaEmbedThumbnail({
		habiticaApiToken: user.habiticaUser.apiToken,
		discordUserId: user.discordUserId,
		habiticaUserId: user.habiticaUser.id,
	})

	return {
		embeds: [
			new EmbedBuilder()
				.setTitle(
					`Viewing ${pluralize(taskType)} of ${user.habiticaUser.name} (@${
						user.habiticaUser.username
					})`
				)
				.setThumbnail(thumbnail)
				.setDescription(
					tasksSummary === ''
						? `[no ${pluralize(taskType)} found]`
						: tasksSummary
				),
		],
		files,
	}
}
