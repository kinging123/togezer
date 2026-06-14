// Shared helper for sending Expo push notifications from edge functions.
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send'

export type PushMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

// Expo tokens look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
function isValidExpoToken(token: unknown): token is string {
  return typeof token === 'string' && /^ExponentPushToken\[.+\]$/.test(token)
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Send a batch of push messages via Expo. Invalid/empty tokens are dropped.
 * Returns the raw ticket array from Expo (one ticket per accepted message),
 * which callers can inspect for `DeviceNotRegistered` and other errors.
 */
export async function sendPush(messages: PushMessage[]): Promise<unknown[]> {
  const valid = messages.filter((m) => isValidExpoToken(m.to))
  if (valid.length === 0) return []

  const tickets: unknown[] = []
  for (const batch of chunk(valid, 100)) {
    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(batch),
    })

    if (!res.ok) {
      console.error('Expo push send failed', res.status, await res.text())
      continue
    }

    const json = await res.json()
    if (Array.isArray(json?.data)) tickets.push(...json.data)
  }

  return tickets
}
