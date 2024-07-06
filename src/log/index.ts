import type { StorageAdapter } from '../types'

export interface LogConfig {
  keyArea?: any
  logger?: (msg: string) => void
}

/**
 * Log adapter
 * Does nothing, like `nil` adapter, but print messages
 */
log.factory = true as const
export function log({
  keyArea = '',
  logger = console.log,
}: LogConfig = {}): StorageAdapter {
  const adapter: StorageAdapter = (key: string) =>
    ({
      set(value: any) {
        logger(`[log adapter] set value "${value}" with key "${key}"`)
      },
      get() {
        logger(`[log adapter] get value for key "${key}"`)
      },
    }) as any

  adapter.keyArea = keyArea
  adapter.noop = true
  return adapter
}
