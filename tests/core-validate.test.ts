import { test } from 'uvu'
import * as assert from 'uvu/assert'
import * as s from 'superstruct'
import { type } from 'arktype'
import { superstructContract } from '@farfetched/superstruct'
import { validate } from '../src/core/validate'

test('should allow undefined schema for validation (valid)', () => {
  const data = { any: 'data' }
  assert.not.throws(() => validate(data))
  assert.equal(validate(data), data)
})

test('should fail on invalid schema (string)', () => {
  const data = { any: 'data' }
  const contract = 'invalid schema' as any

  try {
    validate(data, contract)
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.equal(err, ['Invalid contract'])
  }
})

test('should fail on invalid schema (object)', () => {
  const data = { any: 'data' }
  const contract = {} as any

  try {
    validate(data, contract)
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.equal(err, ['Invalid contract'])
  }
})

test('should validate with function (valid)', () => {
  const data = 'any data'
  const contract = (x: any): x is string => typeof x === 'string'
  assert.not.throws(() => validate(data, contract))
  assert.equal(validate(data, contract), data)
})

test('should validate with function (invalid)', () => {
  const data = 'any data'
  const contract = (x: any): x is number => typeof x === 'number'

  try {
    validate(data, contract)
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.equal(err, ['Invalid data'])
  }
})

test('should validate against contract protocol (simple, valid)', () => {
  const data = 'any data'
  assert.not.throws(() => validate(data, superstructContract(s.string())))
  assert.equal(validate(data, superstructContract(s.string())), data)
})

test('should validate against contract protocol (complex, valid)', () => {
  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  const data = { type: 'asteroid', mass: 42 }
  assert.not.throws(() => validate(data, superstructContract(Asteroid)))
  assert.equal(validate(data, superstructContract(Asteroid)), data)
})

test('should validate against contract protocol (invalid)', () => {
  const Asteroid = s.type({
    type: s.literal('asteroid'),
    mass: s.number(),
  })

  const data = { type: 'not asteroid', mass: Infinity }

  try {
    validate(data, superstructContract(Asteroid))
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.equal(err, [
      'type: Expected the literal `"asteroid"`, but received: "not asteroid"',
    ])
  }
})

test('should validate against standard schema (simple, valid)', () => {
  const schema = type('string')
  const data = 'any data'
  assert.not.throws(() => validate(data, schema))
  assert.equal(validate(data, schema), data)
})

test('should validate against standard schema (complex, valid)', () => {
  const schema = type({
    type: 'string',
    mass: 'number',
  })

  const data = { type: 'asteroid', mass: 42 }
  assert.not.throws(() => validate(data, schema))
  assert.equal(validate(data, schema), data)
})

test('should validate against standard schema (invalid)', () => {
  const schema = type('string')
  const data = 42

  try {
    validate(data, schema)
    assert.unreachable('should have thrown')
  } catch (err) {
    assert.ok(err instanceof type.errors)
    assert.equal(err.summary, 'must be a string (was a number)')
  }
})

test.skip('should validate against async schema (valid)', () => {
  // TODO: after valibot 1.0.0 is released
})

//
// Launch tests
//

test.run()
