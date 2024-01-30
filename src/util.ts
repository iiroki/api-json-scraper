import { allKeys, get } from 'underscore'
import { Logger } from './model'

type MutableObject = {
  [key: string]: any
}

/**
 * Simple equality check for values:
 * - Primitive values are compared with `===`
 * - Objects are compared with `JSON.stringify` and `===`
 */
export const areEqualSimple = (a: any, b: any): boolean => {
  const isObjA = typeof a === 'object'
  const isObjB = typeof b === 'object'

  if (isObjA && isObjB) {
    return JSON.stringify(a) === JSON.stringify(b)
  } else if (isObjA || isObjB) {
    return false
  }

  return a === b
}

export const replacePropertiesFromEnv = (obj: MutableObject, nested?: string[]): void => {
  for (const key of allKeys(obj)) {
    var value: unknown = get(obj, key)
    if (value && typeof value === 'object') {
      replacePropertiesFromEnv(value, [...(nested ?? []), key])
    } else if (typeof value === 'string' && value.startsWith('$')) {
      const envValue = process.env[value.substring(1)]
      if (typeof envValue !== 'undefined') {
        obj[key] = envValue
      }
    }
  }
}

export const createLogger = (name: string): Logger => ({
  log: (...args) => console.log(`[${name}]`, ...args)
})
