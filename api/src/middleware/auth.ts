// Authentication middleware for Cloudflare Access

import type { MiddlewareHandler } from 'hono'
import type { Bindings, Variables } from '../types'

/**
 * Extract JWT from request headers or cookies
 * Priority: Cf-Access-Jwt-Assertion > Authorization Bearer > Cookie
 */
function extractJwt(headers: Headers): string | null {
  // 1. Cloudflare Access header
  const cfAccessJwt = headers.get('Cf-Access-Jwt-Assertion')
  if (cfAccessJwt) return cfAccessJwt

  // 2. Authorization Bearer header
  const authHeader = headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // 3. Cookie
  const cookie = headers.get('Cookie')
  if (cookie) {
    const match = cookie.match(/CF_Authorization=([^;]+)/)
    if (match) return match[1]
  }

  return null
}

/**
 * Hash email to create a stable user ID
 * Uses SHA-256 to hash the lowercase email
 */
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(email.toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Middleware to extract user ID from Cloudflare Access JWT
 * Sets userId in context (null if not authenticated)
 */
export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (c, next) => {
  const jwt = extractJwt(c.req.raw.headers)

  if (jwt) {
    try {
      const parts = jwt.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.email) {
          const userId = await hashEmail(payload.email)
          c.set('userId', userId)
        } else {
          c.set('userId', null)
        }
      } else {
        c.set('userId', null)
      }
    } catch {
      c.set('userId', null)
    }
  } else {
    c.set('userId', null)
  }

  await next()
}

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export const requireAuth: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
