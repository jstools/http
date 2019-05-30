/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

describe('http.fullUrl', function () {

    function _runTestCase (url, params, expected_full_url) {

        it(`${ url }, ${ JSON.stringify(params) } => ${ expected_full_url }`, function () {

            assert.strictEqual(
                http.fullUrl(url, params),
                expected_full_url
            )

        })

    }

    [
        ['http://example.com', null, 'http://example.com'],
        ['http://example.com', { foo: 'bar' }, 'http://example.com?foo=bar'],
        ['http://example.com?foo=bar', { pass: '1234' }, 'http://example.com?foo=bar&pass=1234'],
    ].forEach( (test_case) => _runTestCase.apply(null, test_case) )

})

describe('http.base().getUrl', function () {

    function _runTestCase (base_url, base_params, params, expected_full_url) {

        it(`(${ base_url }, ${ base_params }), ${ JSON.stringify(params) } => ${ expected_full_url }`, function () {

            var _http = http.base(base_url, { params: base_params })

            assert.strictEqual(
                _http.getUrl(params),
                expected_full_url
            )

        })

    }

    [
        ['http://example.com', null, null, 'http://example.com'],
        ['http://example.com', null, { foo: 'bar' }, 'http://example.com?foo=bar'],
        ['http://example.com', { foo: 'bar' }, null, 'http://example.com?foo=bar'],
        ['http://example.com?foo=bar', null, { pass: '1234' }, 'http://example.com?foo=bar&pass=1234'],
        ['http://example.com?foo=bar', { pass: '1234' }, null, 'http://example.com?foo=bar&pass=1234'],
        ['http://example.com?foo=bar', { pass: '1234' }, { pass2: '5678' }, 'http://example.com?foo=bar&pass=1234&pass2=5678'],
    ].forEach( (test_case) => _runTestCase.apply(null, test_case) )

})