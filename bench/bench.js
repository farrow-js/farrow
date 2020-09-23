'use strict'

const { createPipeline } = require('../dist/core')

suite('sync', () => {
  set('type', 'adaptive')
  set('mintime', 1000)
  set('delay', 100)

  const fn = function (n, next) {
    let m = next(n)
    return m + n + 1
  }

  for (let exp = 0; exp <= 10; exp++) {
    const count = Math.pow(2, exp)
    const pipeline = createPipeline({
      defaultOutput: 0,
    })

    for (let i = 0; i < count; i++) {
      pipeline.add(fn)
    }

    bench(`(fn * ${count})`, () => {
      pipeline.run(0)
    })
  }
})

suite('async', () => {
  set('type', 'adaptive')
  set('mintime', 1000)
  set('delay', 100)

  const fn = function (n, next) {
    return next(n).then(m => m + n + 1)
  }

  for (let exp = 0; exp <= 10; exp++) {
    const count = Math.pow(2, exp)
    const pipeline = createPipeline({
      defaultOutput: Promise.resolve(0),
    })

    for (let i = 0; i < count; i++) {
      pipeline.add(fn)
    }

    bench(`(fn * ${count})`, (done) => {
      pipeline.run(0).then(done, done)
    })
  }
})
