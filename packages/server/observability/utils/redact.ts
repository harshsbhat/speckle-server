/**
 * @returns {Record<string, unknown>}
 */
export const redactSensitiveVariables = (variables: unknown): unknown => {
  if (!variables) {
    return variables
  }

  if (Array.isArray(variables)) {
    return variables.map((v) => redactSensitiveVariables(v))
  }

  if (typeof variables !== 'object') {
    return variables
  }

  return Object.entries(variables).reduce((acc, [key, val]) => {
    if (typeof val === 'object') {
      acc[key] = redactSensitiveVariables(val)
      return acc
    }

    if (
      ['email', 'emailaddress', 'email_address', 'emails'].includes(
        key.toLocaleLowerCase()
      )
    ) {
      acc[key] = '[REDACTED]'
      return acc
    }

    const value = acc[key]
    if (value && typeof value === 'string' && value.startsWith('data:image/png;')) {
      acc[key] = `${value.substring(0, 40)}...[truncated image data. Original length: ${
        value.length
      }]`
    }

    acc[key] = val
    return acc
  }, {} as Record<string, unknown>)
}
