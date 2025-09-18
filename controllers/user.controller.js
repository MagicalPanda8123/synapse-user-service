import { registerUser } from '../services/index.js'

export async function registerUserController(req, res, next) {
  try {
    // verify internal JWT claims
    const service = req.service
    if (
      !service ||
      service.iss !== 'auth-service' ||
      !service.permissions ||
      !service.permissions.includes('users:create')
    ) {
      return res
        .status(403)
        .json({ error: 'Forbidden: insufficient permissions' })
    }

    // verify POST payload
    const { account_id, username, first_name, last_name, gender } = req.body
    if (!account_id || !username) {
      return res
        .status(400)
        .json({ error: 'account_id and username are required' })
    }
    const newUser = await registerUser(
      account_id,
      username,
      first_name,
      last_name,
      gender
    )
    res.json(newUser)
  } catch (error) {
    next(error)
  }
}
