'use strict'

const { createPipeline, createContextManager } = require('../dist')

suite('async-generator', () => {
  set('type', 'adaptive')
  set('mintime', 1000)
  set('delay', 100)

  const logic = () => Promise.resolve(true)

  const fn = async function*(next) {
    return logic()
      .then(next)
      .then(logic)
  }

  for (let exp = 0; exp <= 10; exp++) {
    const count = Math.pow(2, exp)
    const pipeline = createPipeline()
    const manager = createContextManager()

    for (let i = 0; i < count; i++) {
      pipeline.use(fn)
    }

    bench(`(fn * ${count})`, done => {
      pipeline.run(manager).then(done, done)
    })
  }
})
