var Promise = require('../microPromise')
var fs = require('fs')

Promise.resolved = Promise.resolve
Promise.rejected = Promise.reject
Promise.deferred = function () {
  promise = new Promise(function () {})
  return {
    promise: promise,
    resolve: function (value) {
      promise.resolve(value)
    },
    reject: function (reason) {
      promise.reject(reason)
    }
  }
}

var promisesAplusTests = require('promises-aplus-tests')
promisesAplusTests(Promise, function (err) {})
