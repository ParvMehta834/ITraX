const TOKEN_KEY = 'itrax_token'
const USER_KEY = 'itrax_user'

const canUseStorage = (storage) => {
  try {
    if (!storage) return false
    const testKey = '__itrax_storage_test__'
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

const getPrimaryStorage = () => {
  if (typeof window === 'undefined') return null
  return canUseStorage(window.sessionStorage) ? window.sessionStorage : null
}

const getFallbackStorage = () => {
  if (typeof window === 'undefined') return null
  return canUseStorage(window.localStorage) ? window.localStorage : null
}

const parseUser = (raw) => {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const getAuthToken = () => {
  const primary = getPrimaryStorage()
  const fallback = getFallbackStorage()
  return primary?.getItem(TOKEN_KEY) || fallback?.getItem(TOKEN_KEY) || null
}

export const getAuthUser = () => {
  const primary = getPrimaryStorage()
  const fallback = getFallbackStorage()
  const parsedPrimary = parseUser(primary?.getItem(USER_KEY))
  if (parsedPrimary) return parsedPrimary
  return parseUser(fallback?.getItem(USER_KEY))
}

export const setAuthSession = ({ token, user }) => {
  const primary = getPrimaryStorage()
  const fallback = getFallbackStorage()

  if (token) {
    primary?.setItem(TOKEN_KEY, token)
    fallback?.setItem(TOKEN_KEY, token)
  }

  if (user) {
    const rawUser = JSON.stringify(user)
    primary?.setItem(USER_KEY, rawUser)
    fallback?.setItem(USER_KEY, rawUser)
  }
}

export const clearAuthSession = () => {
  const primary = getPrimaryStorage()
  const fallback = getFallbackStorage()
  primary?.removeItem(TOKEN_KEY)
  primary?.removeItem(USER_KEY)
  fallback?.removeItem(TOKEN_KEY)
  fallback?.removeItem(USER_KEY)
}

export const updateAuthUser = (nextUser) => {
  if (!nextUser) return
  const current = getAuthUser() || {}
  setAuthSession({ user: { ...current, ...nextUser } })
}
