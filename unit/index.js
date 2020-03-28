var { createEvent, step, launch } = require('effector')

var has = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

function createStorage(storage) {
  storage = storage || localStorage

  var node = createEvent()
  node.fail = createEvent()

  node.graphite.seq = [
    step.run({
      fn({ key, value }) {
        try {
          if (value === undefined) {
            var item = storage.getItem(key)
            if (item !== null) {
              value = JSON.parse(item)
            }
          } else {
            storage.setItem(key, JSON.stringify(value))
          }
        } catch (error) {
          launch(node.fail, { key, value, error })
        }

        return { key, value }
      },
    }),
  ]

  var setters = Object.create(null)
  var getters = Object.create(null)

  node.set = key =>
    has(setters, key)
      ? setters[key]
      : (setters[key] = node.prepend(value => ({ key, value })))

  node.get = key =>
    has(getters, key)
      ? getters[key]
      : (getters[key] = node
          .filter({ fn: data => data.key === key })
          .map(({ value }) => value))

  addEventListener('storage', node)
  return node
}

module.exports = { createStorage }
