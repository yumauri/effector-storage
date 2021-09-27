import { persist as parent } from '..'
import { fp } from '../fp-helper'

/**
 * `persist` with curried `store`
 */
export const persist = fp(parent)
