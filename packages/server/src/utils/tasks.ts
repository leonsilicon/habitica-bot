import { type BaseMessageOptions, EmbedBuilder } from 'discord.js'
import got from 'got'
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
		discordUserId: user.discordUserId,
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

export async function addHabiticaTask({ text }: { text: string }) {
	const { HABITICA_USER_ID, HABITICA_API_TOKEN } = process.env

	await got.post('https://habitica.com/api/v3/tasks/user', {
		json: {
			text,
			type: 'todo',
		},
		headers: {
			'Content-Type': 'application/json',
			'x-api-user': HABITICA_USER_ID!,
			'x-api-key': HABITICA_API_TOKEN!,
			'x-client': `${HABITICA_USER_ID!}-HabiticaLinear`,
		},
	})
}
