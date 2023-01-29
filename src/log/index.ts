import type { StorageAdapter } from '../types'

/**
 * Log adapter
 * Does nothing, like `nil` adapter, but print messages
 */
export function log(
  keyArea: any = '',
  logger: (msg: string) => void = console.log
): StorageAdapter {
  const adapter: StorageAdapter = (key: string) =>
    <any>{
      set(value: any) {
        logger(`[log adapter] set value "${value}" with key "${key}"`)
      },
      get() {
        logger(`[log adapter] get value for key "${key}"`)
      },
    }

  adapter.keyArea = keyArea
  adapter.noop = true
  return adapter
}
