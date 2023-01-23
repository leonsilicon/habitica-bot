import onetime from 'onetime'
import puppeteer from 'puppeteer'

export const getPuppeteerBrowser = onetime(async () => {
	const browser = await puppeteer.launch({ headless: false })
	return browser
})
