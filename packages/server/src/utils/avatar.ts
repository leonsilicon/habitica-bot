import { getPrisma } from '~/utils/prisma.js'

import { getPuppeteerBrowser } from './puppeteer.js'

export async function getHabiticaUserAvatar({
	habiticaUserId,
	habiticaApiToken,
	force,
}: {
	habiticaUserId: string
	habiticaApiToken: string
	force?: boolean
}): Promise<string> {
	const prisma = await getPrisma()

	if (!force) {
		const { cachedAvatarBase64 } = await prisma.habiticaUser.findUniqueOrThrow({
			select: {
				cachedAvatarBase64: true,
			},
			where: {
				id: habiticaUserId,
			},
		})

		if (cachedAvatarBase64 !== null) {
			return cachedAvatarBase64
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

		const avatarBase64 = (await page.screenshot({
			encoding: 'base64',
			type: 'jpeg',
			clip: {
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height,
			},
		})) as string

		await page.close()

		await prisma.habiticaUser.update({
			data: {
				cachedAvatarBase64: avatarBase64,
			},
			where: {
				id: habiticaUserId,
			},
		})

		return avatarBase64
	} finally {
		console.info('Finished fetching Habitica avatar.')
	}
}
