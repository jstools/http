/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

var urls_dataset = [
  ['foo', 'foo'],
  ['resource/:resourceId', 'resource/:resourceId'],
]

describe('http:url', function() {

  urls_dataset.forEach(function (urls) {

    it('http(url): ' + urls[0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })(urls[0])
        .then(function (config) {
          assert.strictEqual( config.url, urls[1] )
          done()
        })
    })

    it('http(options): ' + urls[0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })({
          url: urls[0],
        })
        .then(function (config) {
          assert.strictEqual( config.url, urls[1] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http(null, options): ' + urls[0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })(null, {
          url: urls[0],
        })
        .then(function (config) {
          assert.strictEqual( config.url, urls[1] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http.get(url): ' +  urls[0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })
        .get(urls[0])
        .then(function (config) {
          assert.strictEqual( config.url, urls[1] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

  })

})

describe('http:url_functions', function() {

  [
    ['foo', function () { return 'bar' }, 'foo/bar'],
    ['foo', function () { return 'bar' }, 'foobar', 'foo/bar/foobar'],
    ['foo', function () { return 'bar' }, function () { return 'foobar' }, 'foo/bar/foobar'],
  ].forEach(function (urls) {

    it('http(null, options): ' + urls.slice(0, -1).map( (part) => part instanceof Function ? 'Function' : part ).join('/') + ' -> ' + urls.slice(-1) , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })( urls.slice(0, -1) )
        .then(function (config) {
          assert.strictEqual( config.url, urls.slice(-1)[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http(null, options): ' + urls.slice(0, -1).map( (part) => part instanceof Function ? 'Function' : part ).join('/') + ' -> ' + urls.slice(-1) , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })(null, {
          url: urls.slice(0, -1),
        })
        .then(function (config) {
          assert.strictEqual( config.url, urls.slice(-1)[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http(options): ' + urls.slice(0, -1).map( (part) => part instanceof Function ? 'Function' : part ).join('/') + ' -> ' + urls.slice(-1) , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })({
          url: urls.slice(0, -1),
        })
        .then(function (config) {
          assert.strictEqual( config.url, urls.slice(-1)[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http.get: ' + urls.slice(0, -1).map( (part) => part instanceof Function ? 'Function' : part ).join('/') + ' -> ' + urls.slice(-1) , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })
        .get( urls.slice(0, -1) )
        .then(function (config) {
          assert.strictEqual( config.url, urls.slice(-1)[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

  })

})

describe('http:url_base_functions', function() {

  [
    [function () { return 'resource' }, 'foo', function () { return 'bar' }, 'resource/foo/bar'],
    [function () { return 'resource' }, 'foo', function () { return 'bar' }, 'foobar', 'resource/foo/bar/foobar'],
    [function () { return 'resource' }, 'foo', function () { return 'bar' }, function () { return 'foobar' }, 'resource/foo/bar/foobar'],
  ].forEach(function (urls) {

    it( '<base>/' + urls.slice(1, -1).map( (part) => part instanceof Function ? 'Function' : part ).join('/') + ' -> ' + urls.slice(-1) , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })
        .base( urls[0] )
        .get( urls.slice(1, -1) )
        .then(function (config) {
          assert.strictEqual( config.url, urls.slice(-1)[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

  })

})

describe('http:url_base', function() {

  var headers_nested = [
    ['bar', 'foo/bar'],
    ['nested/:nestedId', 'resource/:resourceId/nested/:nestedId'],
  ]

  headers_nested.forEach(function (urls, i) {

    it( urls[0] + ' + ' + urls_dataset[i][0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })
        .base(urls_dataset[i][0])
        .get(urls[0])
        .then(function (config) {
          assert.strictEqual( config.url, urls[1] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

  })

})

describe('http:url_base_2', function() {

  var headers_nested = [
    ['bar', 'foobar', 'foo/bar/foobar'],
    ['nested/:nestedId', 'sub-nested/:subNestedId', 'resource/:resourceId/nested/:nestedId/sub-nested/:subNestedId'],
  ]

  headers_nested.forEach(function (urls, i) {

    it( urls[0] + ' + ' + urls_dataset[i][0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })
        .base(urls_dataset[i][0])
        .base(headers_nested[i][0])
        .get(urls[1])
        .then(function (config) {
          assert.strictEqual( config.url, urls[2] )
          done()
        }, function (err) {
          console.log('Unexpected error', err); // eslint-disable-line
        }).catch(done)
    })

  })

})
