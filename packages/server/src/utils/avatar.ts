import type { Buffer } from 'node:buffer'

import { getPuppeteerBrowser } from './puppeteer.js'

const avatarCache = new Map<string, Buffer>()

export function getCachedHabiticaUserAvatar({
	habiticaUserId,
}: {
	habiticaUserId: string
}) {
	return avatarCache.get(habiticaUserId)
}

export function deleteCachedHabiticaUserAvatar({
	habiticaUserId,
}: {
	habiticaUserId: string
}) {
	avatarCache.delete(habiticaUserId)
}

export async function getHabiticaUserAvatar({
	habiticaUserId,
	habiticaApiToken,
	force,
}: {
	habiticaUserId: string
	habiticaApiToken: string
	force?: boolean
}) {
	if (!force) {
		const cachedAvatar = avatarCache.get(habiticaUserId)
		if (cachedAvatar !== undefined) {
			return cachedAvatar
		}
	}

	try {
		console.info('Fetching user avatar with Puppeteer...')
		const browser = await getPuppeteerBrowser()
		const page = await browser.newPage()
		await page.goto('https://habitica.com')
		await page.evaluate(
			({ habiticaUserId, habiticaApiToken }) => {
				localStorage.setItem(
					'habit-mobile-settings',
					JSON.stringify({
						auth: { apiId: habiticaUserId, apiToken: habiticaApiToken },
					})
				)
			},
			{ habiticaUserId, habiticaApiToken }
		)
		await page.goto(`https://habitica.com/profile/${habiticaUserId}`, {
			waitUntil: 'networkidle0',
		})
		const rect = await page.evaluate(() => {
			const element = document.querySelector('.avatar')
			if (element === null) {
				return null
			}

			const { x, y, width, height } = element.getBoundingClientRect()
			return { left: x, top: y, width, height, id: element.id }
		})

		if (rect === null) {
			throw new Error('Avatar could not be loaded.')
		}

		const avatarBuffer = (await page.screenshot({
			encoding: 'binary',
			type: 'jpeg',
			clip: {
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height,
			},
		})) as Buffer

		await page.close()

		avatarCache.set(habiticaUserId, avatarBuffer)
		return avatarBuffer
	} finally {
		console.info('Finished fetching Habitica avatar.')
	}
}
