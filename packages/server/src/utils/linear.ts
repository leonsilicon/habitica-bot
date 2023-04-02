import { LinearClient } from '@linear/sdk'
import hashObject from 'hash-obj'
import mem from 'mem'

import { linearWebhookUrl } from '~/utils/webhook.js'

// Api key authentication
const getLinear = mem(
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

export async function setLinearWebhook({ apiKey }: { apiKey: string }) {
	const linear = getLinear({ apiKey })
	await linear.createWebhook({
		url: linearWebhookUrl,
		resourceTypes: ['ISSUE'],
	})
}
