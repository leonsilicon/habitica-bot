export const habiticaBotWebhookUrl =
	'https://habitica-bot.leondreamed.com/webhook'

export const getLinearWebhookUrl = ({ userId }: { userId: string }) =>
	'https://90ab-73-134-223-167.ngrok.io/linear-webhook?userId=' + userId
