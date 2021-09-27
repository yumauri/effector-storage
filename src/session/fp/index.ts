import { persist as parent } from '..'
import { fp } from '../../fp-helper'

/**
 * Partially applied `persist` with predefined `sessionStorage` adapter and curried `store`
 */
export const persist = fp(parent)
