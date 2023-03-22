import { LinearClient } from '@linear/sdk'
import onetime from 'onetime'

// Api key authentication
const getLinear = onetime(
	() =>
		new LinearClient({
			apiKey: process.env.LINEAR_API_KEY,
		})
)

export async function getLinearTasks() {
	const linear = getLinear()
	const me = await linear.viewer
	const myIssues = await me.assignedIssues()

	return myIssues.nodes
}

export async function setLinearWebhook() {
	const linear = getLinear()
	linear.createWebhook({

	})
}