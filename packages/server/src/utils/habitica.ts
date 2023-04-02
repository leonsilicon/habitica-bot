/* eslint-disable @typescript-eslint/ban-types */

import { type Method, got } from 'got'
import invariant from 'tiny-invariant'
import { type PartialOnUndefinedDeep } from 'type-fest'

import {
	type HabiticaTasksResponse,
	type HabiticaUserResponse,
	type HabiticaWebhooksResponse,
} from '~/types/habitica.js'
import { env } from '~/utils/env.js'

function defineRequestMap<
	R extends Record<
		string,
		{
			response?: any
			body?: Record<string, unknown>
			pathParams?: Record<string, true>
			searchParams?: Record<string, unknown>
		}
	>
>(requestMap: R): R {
	return requestMap as any
}

const requestMap = defineRequestMap({
	'GET /api/v3/user': {
		response: {} as HabiticaUserResponse,
	},
	'GET /api/v3/tasks/user': {
		searchParams: {
			type: {} as 'habits' | 'dailys' | 'todos' | 'rewards' | 'completedTodos',
		},
		response: {} as HabiticaTasksResponse,
	},
	'POST /api/v3/tasks/user': {
		body: {
			text: {} as string,
			type: {} as 'todo' | 'habit' | 'daily' | 'reward',
			notes: {} as string | undefined,
			priority: {} as '0.1' | '1' | '1.5' | '2' | undefined,
		},
		response: {} as HabiticaTasksResponse,
	},
	'GET /api/v3/user/webhook': {
		response: {} as HabiticaWebhooksResponse,
	},
	'POST /api/v3/user/webhook': {
		body: {
			id: {} as string | undefined,
			url: {} as string,
		},
	},
	'PUT /api/v3/user/webhook/:id': {
		body: {
			enabled: {} as boolean,
		},
	},
	'DELETE /api/v3/user/webhook/:id': {
		pathParams: {
			id: true,
		},
	},
})

type RequestMap = typeof requestMap

export async function gotHabitica<Request extends keyof RequestMap>(
	request: Request,
	options: {
		userId: string
		apiToken: string
	} & (RequestMap[Request] extends { pathParams: any }
		? { pathParams: Record<keyof RequestMap[Request]['pathParams'], string> }
		: {}) &
		(RequestMap[Request] extends { searchParams: any }
			? {
					searchParams: PartialOnUndefinedDeep<
						RequestMap[Request]['searchParams']
					>
			  }
			: {}) &
		(RequestMap[Request] extends { body: any }
			? { body: PartialOnUndefinedDeep<RequestMap[Request]['body']> }
			: {})
): Promise<
	RequestMap[Request] extends { response: any }
		? RequestMap[Request]['response']
		: unknown
> {
	let [method, url] = request.split(' ')
	invariant(method !== undefined)
	invariant(url !== undefined)

	if ('pathParams' in options) {
		for (const [key, value] of Object.entries(options.pathParams)) {
			url = url.replace(`:${key}`, value)
		}
	}

	const response = await got(`https://habitica.com${url}`, {
		searchParams: 'searchParams' in options ? options.searchParams : undefined,
		method: method as Method,
		body: 'body' in options ? JSON.stringify(options.body) : undefined,
		headers: {
			'Content-Type': 'application/json',
			'x-api-user': options.userId,
			'x-api-key': options.apiToken,
			'x-client': `${env('HABITICA_USER_ID')}-HabiticaBot`,
		},
	})

	const result = JSON.parse(response.body) as {
		success: boolean
		data: RequestMap[Request]
	}

	if (!result.success) {
		console.error(`Request \`${request}\` failed:`, result)
		throw new Error(`Request \`${request}\` failed.`)
	}

	return result.data
}
