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

export async function getPublicTasks({ appUserId }: { appUserId: string }) {
	const prisma = await getPrisma()
	const { habiticaUser } = await prisma.appUser.findUniqueOrThrow({
		select: {
			habiticaUser: {
				select: {
					apiToken: true,
					id: true,
				},
			},
		},
		where: {
			id: appUserId,
		},
	})

	if (habiticaUser === null) {
		throw new Error('User not linked to habitica account')
	}

	const allTasks = await gotHabitica('GET /api/v3/tasks/user', {
		habiticaUser,
		searchParams: {},
	})
	const publicTasks = allTasks.filter((task) => isTaskPublic(task))

	return publicTasks
}

export async function createTasksSummaryMessage({
	appUserId,
	taskType,
}: {
	appUserId: string
	taskType: 'habit' | 'todo' | 'daily'
}): Promise<BaseMessageOptions> {
	const prisma = await getPrisma()
	const appUser = await prisma.appUser.findFirstOrThrow({
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
			id: appUserId,
		},
	})

	invariant(appUser.habiticaUser !== null)

	const publicTasks = await getPublicTasks({
		appUserId,
	})

	const tasksSummary = publicTasks
		.filter((task) => {
			if (task.type !== taskType) return false

			if (taskType === 'daily' && !task.isDue) return false

			return true
		})
		.map(
			(task) =>
				`${task.completed ? ':white_check_mark:' : ':white_large_square:'} ${
					task.text
				}`
		)
		.join('\n')

	const { files, thumbnail } = await getHabiticaEmbedThumbnail({
		discordUserId: appUser.discordUserId,
	})

	return {
		embeds: [
			new EmbedBuilder()
				.setTitle(
					`Viewing ${pluralize(taskType)} of ${appUser.habiticaUser.name} (@${
						appUser.habiticaUser.username
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
