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
