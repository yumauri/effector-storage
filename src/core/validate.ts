import { Contract } from '../types'

export function validate<Data>(
  raw: unknown,
  schema?: Contract<Data>
): Data | Promise<Data> {
  // no contract -> data is valid
  if (!schema) {
    return raw as Data
  }

  // contract is not a function nor object
  if (typeof schema !== 'function' && typeof schema !== 'object') {
    throw ['Invalid contract']
  }

  // contract is a Contract protocol
  if ('isData' in schema) {
    if (schema.isData(raw)) {
      return raw as Data
    }
    throw schema.getErrorMessages(raw)
  }

  // contract is a Standard Schema
  if ('~standard' in schema) {
    const result = schema['~standard'].validate(raw)
    const check = (result: any) => {
      if (result.issues) throw result.issues
      return result.value as Data
    }
    return 'then' in result
      ? Promise.resolve(result).then(check)
      : check(result)
  }

  // contract is a simple 'type guard'-like function
  if (typeof schema === 'function') {
    if (schema(raw)) {
      return raw as Data
    }
    throw ['Invalid data']
  }

  // if contract is not supported, throw an error
  throw ['Invalid contract']
}
