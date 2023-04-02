import { randomUUID } from 'node:crypto'

import { LinearClient } from '@linear/sdk'
import hashObject from 'hash-obj'
import mem from 'mem'

import { getLinearWebhookUrl } from '~/utils/webhook.js'

export const getLinear = mem(
	({ apiKey }: { apiKey: string }) =>
		new LinearClient({
			apiKey,
		}),
	{ cacheKey: hashObject }
)

export async function getLinearTasks({ apiKey }: { apiKey: string }) {
	const linear = getLinear({ apiKey })
	const me = await linear.viewer
	const myIssues = await me.assignedIssues()

	return myIssues.nodes
}

export async function createLinearWebhook({
	apiKey,
	appUserId,
}: {
	apiKey: string
	appUserId: string
}) {
	const linear = getLinear({ apiKey })
	const { webhook } = await linear.createWebhook({
		id: randomUUID(),
		url: getLinearWebhookUrl({ appUserId }),
		resourceTypes: ['Issue'],
		allPublicTeams: true
	})

	return webhook
}

export async function deleteLinearWebhook({ apiKey }: { apiKey: string }) {
	const linear = getLinear({ apiKey })
	await linear.deleteWebhook('habitica-linear')
}
