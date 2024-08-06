import type { Event, Effect } from 'effector'
import type {
  ConfigAdapter,
  ConfigAdapterFactory,
  StorageHandles,
  ConfigCreateStorage,
  Contract,
  Fail,
} from '../types'
import {
  attach,
  // clearNode,
  // createNode,
  createStore,
  is,
  sample,
  scopeBind,
} from 'effector'
import { getAreaStorage } from './area'

// helper function to validate data with contract
function validate<T>(raw: unknown, contract?: Contract<T>) {
  if (
    !contract || // no contract -> data is valid
    ('isData' in contract ? contract.isData(raw) : contract(raw))
  ) return raw as T // prettier-ignore
  throw (contract as any).getErrorMessages?.(raw) ?? ['Invalid data']
}

type Config<State> = Partial<
  ConfigCreateStorage<State> & { key: string } & (
      | ConfigAdapter
      | ConfigAdapterFactory<any>
    )
>

export function createStorage<State, Err = Error>(
  ...configs: (string | Config<State> | undefined)[]
): StorageHandles<State, Err> {
  const config: Config<State> = {}
  for (const cfg of configs) {
    Object.assign(config, typeof cfg === 'string' ? { key: cfg } : cfg)
  }

  const {
    adapter: adapterOrFactory,
    context,
    key: keyName,
    keyPrefix = '',
    contract,
  } = config

  if (!adapterOrFactory) {
    throw Error('Adapter is not defined')
  }
  if (!keyName) {
    throw Error('Key is not defined')
  }

  const adapter =
    'factory' in adapterOrFactory ? adapterOrFactory(config) : adapterOrFactory

  const key = keyName
  const storage = getAreaStorage<State>(
    adapter.keyArea || adapter,
    keyPrefix + key
  )

  // const region = createNode()
  // let disposable: (_: any) => void = () => {}
  // const desist = () => disposable(clearNode(region))

  const ctx = createStore<[any?]>(
    [is.store(context) ? context.defaultState : undefined],
    { serialize: 'ignore' }
  )

  const value = adapter<State>(keyPrefix + key, (x) => {
    update(x)
  })

  // if (typeof value === 'function') {
  //   disposable = value
  // }

  const fail = (
    operation: 'get' | 'set' | 'validate',
    error: unknown,
    value?: any
  ) =>
    ({
      key,
      keyPrefix,
      operation,
      error,
      value: typeof value === 'function' ? undefined : value, // hide internal "box" implementation
    }) as Fail<Err>

  const op = <T>(
    operation: 'get' | 'set' | 'validate',
    fn: (value: any, arg: any) => T,
    value: any,
    arg: any
  ): T => {
    try {
      return fn(value, arg)
    } catch (error) {
      throw fail(operation, error, value)
    }
  }

  const getFx = attach({
    source: ctx,
    effect([ref], raw?: void) {
      const result = op('get', value.get, raw, ref) as any
      return typeof result?.then === 'function'
        ? Promise.resolve(result)
            .then((result) => op('validate', validate, result, contract))
            .catch((error) => {
              throw fail('get', error, raw)
            })
        : op('validate', validate, result, contract)
    },
  }) as Effect<void, State, any> // as Effect<void, State, Fail<Err>>

  const setFx = attach({
    source: ctx,
    effect([ref], state: State) {
      const result = op('set', value.set, state, ref)
      if (typeof result?.then === 'function') {
        return Promise.resolve(result)
          .then(() => undefined)
          .catch((error) => {
            throw fail('set', error, state)
          })
      }
    },
  }) as Effect<State, void, any> // as Effect<State, void, Fail<Err>>

  const removeFx = attach({
    mapParams: () => undefined as any,
    effect: setFx,
  }) as Effect<void, void, Fail<Err>>

  let update: (raw?: any) => any = getFx
  ctx.updates.watch(() => {
    update = scopeBind(getFx as any, { safe: true })
  })

  const external = createStore<boolean>(true, { serialize: 'ignore' }) //
    .on([getFx.finally, setFx.finally], () => false)

  sample({
    clock: [getFx.doneData as Event<any>, sample(setFx, setFx.done)],
    filter: (x) => x !== undefined,
    target: storage,
  })

  sample({
    clock: storage,
    filter: external,
    fn: () => undefined,
    target: getFx,
  })

  sample({
    clock: [getFx.finally, setFx.finally],
    fn: () => true,
    target: external,
  })

  if (context) {
    ctx.on(context, ([ref], payload) => [payload === undefined ? ref : payload])
  }

  return {
    getFx,
    setFx,
    removeFx,
  }
}
