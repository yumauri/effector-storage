import { tie } from '..'
import { storage } from '../storage'

export const localStorage = storage(window.localStorage, true)
export const withStorage = tie({ with: localStorage })
