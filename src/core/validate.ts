import type { Contract } from '../types'

export const validate = <Data>(
  raw: unknown,
  contract?: Contract<Data>
): Data | Promise<Data> => {
  // no contract -> data is valid
  if (!contract) {
    return raw as Data
  }

  // contract is not a function nor object
  if (typeof contract !== 'function' && typeof contract !== 'object') {
    throw ['Invalid contract']
  }

  // contract is a Contract protocol
  if ('isData' in contract) {
    if (contract.isData(raw)) {
      return raw as Data
    }
    throw contract.getErrorMessages(raw)
  }

  // contract is a Standard Schema
  if ('~standard' in contract) {
    const result = contract['~standard'].validate(raw)
    const check = (result: any) => {
      if (result.issues) throw result.issues
      return result.value as Data
    }
    return 'then' in result
      ? Promise.resolve(result).then(check)
      : check(result)
  }

  // contract is a simple 'type guard'-like function
  if (typeof contract === 'function') {
    if (contract(raw)) {
      return raw as Data
    }
    throw ['Invalid data']
  }

  // if contract is not supported, throw an error
  throw ['Invalid contract']
}
