module.exports = MicroPromise

var State = {
  PENDING: 0,
  FULFILLED: 1,
  REJECTED: 2
}

function isFun (f) {
  return typeof f === 'function'
}

function isThenable (obj) {
  return obj && typeof obj['then'] === 'function'
}

function bind (f, me) {
  return function () {
    return f.apply(me, arguments)
  }
}

function invokeCallback (promise) {
  if (promise.status === State.PENDING) {
    return
  }
  process.nextTick(function () {
    while (promise.tasks.length > 0) { // 2.2.6
      var task = promise.tasks.shift()
      try {
        var operation = (promise.status === State.FULFILLED ?
          (task.fulfillPromise || null) :
          (task.rejectPromise || null)
        )
        if (isFun(operation)) {
          var value = bind(operation, null)(promise.result)
          resolutionProcedure(task.thenPromise, value); // 2.2.7.1
        } else {
          (promise.status === State.FULFILLED ?
            bind(task.thenPromise.resolve, task.thenPromise) :
            bind(task.thenPromise.reject, task.thenPromise))(promise.result); // 2.2.7.3  2.2.7.4
        }
      } catch (e) {
        task.thenPromise.reject(e); // 2.2.7.2
      }
    }
  })
}

function resolutionProcedure (promise, x) {
  if (promise === x) { // 2.3.1
    promise.reject(new TypeError("it cant't fulfill promise equals value condition"))
  } else if (x && x.constructor === MicroPromise) { // 2.3.2
    if (x.status === State.PENDING) { // 2.3.2.1
      x.then(function (value) {
        promise.resolve(value)
      }, function (reason) {
        promise.reject(reason)
      })
    } else if (x.status === State.FULFILLED) { // 2.3.2.2
      promise.resolve(value)
    } else if (x.status === State.FULFILLED) { // 2.3.2.3
      promise.reject(reason)
    }
  } else if (x !== null && (typeof x == 'object' || typeof x == 'function')) { // 2.3.3
    var isCalled = false; // 2.3.3.3.3
    try {
      var then = x.then; // 2.3.3.1
      if (typeof then === 'function') { // 2.3.3.3
        then.call(x, function (value) {
          isCalled || resolutionProcedure(promise, value); // 2.3.3.3.1
          isCalled = true
        }, function (reason) {
          isCalled || promise.reject(reason); // 2.3.3.3.2
          isCalled = true
        })
      } else {
        promise.resolve(x); // 2.3.3.4
      }
    } catch (e) {
      isCalled || promise.reject(e); // 2.3.3.2  2.3.3.3.4
    }
  } else {
    promise.resolve(x); // 2.3.4
  }
}

function MicroPromise (resolver) {
  if (!isFun(resolver))
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor')
  if (!(this instanceof MicroPromise)) return new MicroPromise(resolver)

  this.status = State.PENDING
  this.tasks = []
  process.nextTick(bind(function () {
    try {
      return resolver.call(null, bind(this.resolve, this), bind(this.reject, this))
    } catch (err) {
      return this.reject(err)
    }
  }, this))
}

MicroPromise.prototype.resolve = function (value) {
  var self = this
  self.result = value
  if (self.status === State.PENDING) {
    self.status = State.FULFILLED
    invokeCallback(self)
  } else {
    return
  }
}

MicroPromise.prototype.reject = function (reason) {
  var self = this
  self.result = reason
  if (self.status === State.PENDING) {
    self.status = State.REJECTED
    invokeCallback(self)
  } else {
    return
  }
}

MicroPromise.prototype.then = function (onFulfilled, onRejected) {
  var self = this
  var promise = MicroPromise(function () {})
  if (self.status === State.PENDING) {
    self.tasks.push({
      fulfillPromise: isFun(onFulfilled) ? onFulfilled : null,
      rejectPromise: isFun(onRejected) ? onRejected : null,
      thenPromise: promise
    })
  } else if (self.status === State.FULFILLED) {
    isFun(onFulfilled) && process.nextTick(onFulfilled.call(null, self.value))
  } else if (self.status === State.REJECTED) {
    isFun(onRejected) && process.nextTick(onRejected.call(null, self.reason))
  }
  invokeCallback(self)
  return promise
}

MicroPromise.all = function (promiseArray) {
  var promise = MicroPromise(function () {})
  var state = State.PENDING
  var results = []
  results.num = 0
  console.log('length = ' + promiseArray.length)
  for (var i = 0; i < promiseArray.length; i++) {
    (function (i) {
      promiseArray[i].then(function (value) {
        if (state !== State.REJECTED) {
          results[i] = value
          results.num++
          if (results.num === promiseArray.length) {
            state = State.FULFILLED
            promise.resolve(results)
          }
        }
      }, function (reason) {
        if (state !== State.REJECTED) {
          state = State.REJECTED
          promise.reject(reason)
        }
      })
    })(i)
  }
  return promise
}
