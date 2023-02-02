import { Buffer } from 'node:buffer'

import GifEncoder from 'gifencoder'
// @ts-expect-error: no types
import PNG from 'png-js'

import { getDiscordClient } from '~/utils/discord.js'
import { getPrisma } from '~/utils/prisma.js'

import { getPuppeteerBrowser } from './puppeteer.js'

export async function updateHabiticaUserAvatar({
	habiticaUserId,
	habiticaApiToken,
	animated,
}: {
	habiticaUserId: string
	habiticaApiToken: string
	animated: boolean
}): Promise<Buffer> {
	const prisma = await getPrisma()

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

		// We remove all the modals from the DOM that might interfere with our screenshot
		await page.evaluate(() => {
			const elements = document.querySelectorAll('[id*="_modal_outer_"]')
			for (const element of elements) {
				element.parentNode?.removeChild(element)
			}
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

		let avatarBase64: string
		if (animated) {
			console.info('Rendering an animated avatar...')
			const encoder = new GifEncoder(rect.width, rect.height)

			// 24 frames total, 7200ms length
			// Manually measured to be 300ms per frame
			encoder.start()
			encoder.setDelay(300)
			encoder.setRepeat(0)

			let frameNumber = 0
			const frames: Record<number, any> = {}

			await new Promise<void>((resolve) => {
				// Take a screenshot every 300 milliseconds
				const interval = setInterval(() => {
					const frame = frameNumber

					if (frame === 32) {
						clearInterval(interval)
					}

					;(async () => {
						const pngBuffer = await page.screenshot({
							encoding: 'binary',
							type: 'jpeg',
							clip: {
								x: rect.left,
								y: rect.top,
								width: rect.width,
								height: rect.height,
							},
						})

						const pixels = await new PNG(pngBuffer).decode()
						frames[frame] = pixels

						console.info(`Finished capturing GIF frame ${frame}!`)

						if (frame === 32) {
							resolve()
						}
					})()

					frameNumber += 1
				}, 300)
			})

			encoder.finish()
			avatarBase64 = encoder.out.getData().toString('base64')
		} else {
			avatarBase64 = (await page.screenshot({
				encoding: 'base64',
				type: 'jpeg',
				clip: {
					x: rect.left,
					y: rect.top,
					width: rect.width,
					height: rect.height,
				},
			})) as string
			console.info('Screenshotted avator!')
		}

		await page.close()

		await prisma.habiticaUser.update({
			data: {
				avatar: {
					update: {
						base64Data: avatarBase64,
						isAnimated: animated,
					},
				},
			},
			where: {
				id: habiticaUserId,
			},
		})

		return Buffer.from(avatarBase64, 'base64')
	} finally {
		console.info('Finished fetching Habitica avatar.')
	}
}

export async function getHabiticaUserAvatarWithFallback({
	discordUserId,
}: {
	discordUserId: string
}): Promise<{ isAnimated: boolean; data: Buffer } | { url: string }> {
	const prisma = await getPrisma()
	const { habiticaUser } = await prisma.user.findUniqueOrThrow({
		select: {
			habiticaUser: {
				select: {
					avatar: true,
				},
			},
		},
		where: {
			discordUserId,
		},
	})

	const client = getDiscordClient()
	if (habiticaUser?.avatar) {
		return {
			isAnimated: habiticaUser.avatar.isAnimated,
			data: Buffer.from(habiticaUser.avatar.base64Data, 'base64'),
		}
	} else {
		const discordUser = await client.users.fetch(discordUserId)
		return { url: discordUser.displayAvatarURL() }
	}
}
