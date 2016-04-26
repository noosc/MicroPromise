var Promise = require('../microPromise')
var promise = new Promise(function (resolve, reject) {
  console.log('start')
  setTimeout(function () {
    resolve(100)
    console.log('end')
  }, 2000)
})

Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (item) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(item)
    }, 1000 + item)
  })
})).then(function (arr) {
  for (var i = arr.length - 1; i >= 0; i--) {
    console.log(arr[i])
  }
})
