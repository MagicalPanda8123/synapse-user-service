import { createRemoteJWKSet, jwtVerify } from 'jose'

/**
 * Retrieve the public key via JWKS served publicly by the auth service.
 *
 * The createRemoteJWKSet() automatically provides caching behavior
 * out of the box for us.
 *
 */
const JWKS = createRemoteJWKSet(
  new URL(
    process.env.AUTH_JWKS_URL || 'http://localhost:4000/api/auth/jwks.json'
  )
)

export async function internalAuthMiddleware(req, res, next) {
  // console.log('lets gooooooooooo jwt')
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'Missing or invalid Authorizaion header' })
    }
    const token = authHeader.split(' ')[1]
    const { payload } = await jwtVerify(token, JWKS)

    // check for internal service claims
    if (payload.iss !== 'auth-service') {
      return res
        .status(403)
        .json({ error: 'Forbidden: not an internal service request' })
    }

    req.service = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
