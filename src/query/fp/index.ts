import { persist as parent } from '..'
import { fp } from '../../fp-helper'

export { pushState, replaceState, locationAssign, locationReplace } from '..'

/**
 * Partially applied `persist` with predefined `localStorage` adapter and curried `store`
 */
export const persist = fp(parent)
