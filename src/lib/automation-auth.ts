import { NextRequest } from 'next/server'

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

export async function isAutomationAuthorized(request: NextRequest) {
  const expected = process.env.AUTOMATION_SECRET
  const received = request.headers.get('x-automation-secret')
  if (!expected || !received) return false
  const [left, right] = await Promise.all([digest(expected), digest(received)])
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}
