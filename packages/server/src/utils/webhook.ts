export const habiticaBotWebhookUrl =
	'https://habitica-bot.leondreamed.com/webhook'

export const getLinearWebhookUrl = ({ appUserId }: { appUserId: string }) =>
	'https://90ab-73-134-223-167.ngrok.io/linear-webhook?userId=' + appUserId
