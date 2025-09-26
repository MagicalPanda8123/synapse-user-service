import { createRemoteJWKSet, jwtVerify } from 'jose'

/**
 * Retrieve the public key via JWKS served publicly by the auth service.
 *
 * The createRemoteJWKSet() automatically provides caching behavior
 * out of the box for us.
 *
 */
const JWKS = createRemoteJWKSet(new URL(process.env.AUTH_JWKS_URL || 'http://localhost:4000/api/auth/jwks.json'))

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorizaion header' })
    }
    const token = authHeader.split(' ')[1]
    const { payload } = await jwtVerify(token, JWKS)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Optional authentication middleware that allows requests to continue
 * regardless of whether a valid token is provided or not.
 *
 * - If a valid token is provided: req.user will be set with payload
 * - If no token is provided: req.user will be undefined and request continues
 * - If an invalid token is provided: req.user will be undefined and request continues
 */
export async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    // No authorization header provided - continue without user info
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined
      return next()
    }

    const token = authHeader.split(' ')[1]

    // Try to verify the token
    const { payload } = await jwtVerify(token, JWKS)
    req.user = payload
  } catch (error) {
    // Token verification failed - continue without user info
    // Don't throw error, just log it for debugging purposes
    console.warn('Optional auth failed:', error.message)
    req.user = undefined
  }

  next()
}
