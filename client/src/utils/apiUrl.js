export function buildApiUrl(path = '') {
  const envBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!envBase) {
    return normalizedPath.startsWith('/api') ? normalizedPath : `/api${normalizedPath}`
  }

  if (/\/api$/i.test(envBase)) {
    return normalizedPath.startsWith('/api')
      ? `${envBase}${normalizedPath.slice(4)}`
      : `${envBase}${normalizedPath}`
  }

  return normalizedPath.startsWith('/api')
    ? `${envBase}${normalizedPath}`
    : `${envBase}/api${normalizedPath}`
}
