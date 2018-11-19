/* globals describe, it */

import assert from 'assert';
import http from '../src/http-rest';

var urls_dataset = [
  ['foo', 'foo'],
  ['resource/:resourceId', 'resource/:resourceId'],
];

describe('http:url', function() {

  urls_dataset.forEach(function (urls) {

    it( urls[0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config);
        })
        .get(urls[0])
        .then(function (config) {
          assert.strictEqual( config.url, urls[1] );
          done();
        }, function (err) {
          console.log('Unexpected error', err); // eslint-disable-line
        });
    });

  });

});

describe('http:url_base', function() {

  var headers_override = [
    ['bar', 'foo/bar'],
    ['nested/:nestedId', 'resource/:resourceId/nested/:nestedId'],
  ];

  headers_override.forEach(function (urls, i) {

    it( urls[0] + ' + ' + urls_dataset[i][0] + ' -> ' + urls[1] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config);
        })
        .base(urls_dataset[i][0])
        .get(urls[0])
        .then(function (config) {
          assert.strictEqual( config.url, urls[1] );
          done();
        }, function (err) {
          console.log('Unexpected error', err); // eslint-disable-line
        });
    });

  });

});
