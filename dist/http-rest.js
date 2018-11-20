'use strict';

var _isType = function (type, o) {
      return o ? typeof o === type : function (_o) {
        return typeof _o === type
      }
    };

function isObject (o) {
  return o && typeof o === 'object'
}

var isArray = Array.isArray || function (o) {
  return o instanceof Array
};

function isPlainObject (o) {
  return o && !isArray(o) && typeof o === 'object'
}

var isString = _isType('string');
var isFunction = _isType('function');

function toUnderscoreCase (text) {
  return text.replace(/-/g, '_').replace(/([a-z])([A-Z])/, function (matched, a, b) { return a + '_' + b }).toLowerCase()
}

function toCamelCase (text) {
  return text.replace(/([a-z])[-_]([a-z])/g, function (matched, a, b) { return a + b.toUpperCase() })
}

function toHeaderCase (text) {
  var key = text.replace(/_/g, '-').replace(/([a-z])([A-Z])/, function (matched, a, b) { return a + '-' + b });
  return key[0].toUpperCase() + key.substr(1).toLowerCase().replace(/-[a-z]/g, function (matched) { return matched.toUpperCase() })
}

function _passThrought (value) {
  return value
}

var case_formatters = {
  underscore: toUnderscoreCase,
  camel: toCamelCase,
  header: toHeaderCase,
};

function mapObject (o, iteratee, thisArg, mapFormatter) {
  var result = {};
  mapFormatter = mapFormatter || _passThrought;
  for( var key in o ) {
    result[mapFormatter(key)] = iteratee.call(thisArg, o[key], key);
  }
  return result
}

function copy (src, mapFormatter) {
  if( typeof mapFormatter === 'string' ) mapFormatter = case_formatters[mapFormatter];

  if( isArray(src) ) {
    return src.map(function (item) {
      return copy(item, mapFormatter)
    })
  }

  if( isObject(src) ) {
    return mapObject(src, function (item) {
      return copy(item, mapFormatter)
    }, src, mapFormatter)
  }

  return src
}

function extend (dest, src) {
  dest = dest || {};
  for( var key in src ) dest[key] = src[key];
  return dest
}

function _mergeArrays(dest, src, concat_arrays) {
  if( !concat_arrays ) {
    return src.map(function (item) { return copy(item) })
  }
  [].push.apply(dest, src.map(function (item) { return copy(item) }) );
  // for( var i = 0, n = src.length ; i < n ; i++ ) {
  //   dest.push( dest[i] ? merge(dest[i], src[i], concat_arrays) : copy(src[i]) );
  // }
  return dest
}

function merge (dest, src, concat_arrays) {
  if( typeof dest !== typeof src ) {
    if( isArray(src) ) dest = [];
    else if( typeof src === 'object' ) dest = {};
    else return src
  }
  if( isArray(src) ) return _mergeArrays(dest, src, concat_arrays)
  if( typeof src === 'object' ) {
    for( var key in src ) {
      dest[key] = merge(dest[key], src[key], concat_arrays);
    }
    return dest
  }
  return src
}

function resolveFunctions (o, args, this_arg) {
  for( var key in o ) {
    if( isFunction(o[key]) ) {
      o[key] = o[key].apply(this_arg, args);
    } else if( isObject(o[key]) ) {
      o[key] = resolveFunctions(o[key], args, this_arg);
    }
  }
  return o
}


var arrayPush = Array.prototype.push,
    arraySlice = Array.prototype.slice;

function _sanitizePath(path, i, last) {
  if( i > 0 ) path = path.replace(/^\.*\//, '');
  if( !last ) path = path.replace(/\/$/, '');
  return path.split(/\/+/)
}

function _joinPaths (paths) {
  var last = paths.length - 1;
  return paths.reduce(function (result, path, i) {
    if( path === '.' ) return result
    if( /^[a-z]+:\/\//.test(path) ) return [i === last ? path : path.replace(/\/$/, '')]
    if( /^\//.test(path) ) return _sanitizePath(path, 0, i === last )

    path = path.replace(/\.\.\//g, function () {
      result = result.slice(0, -1);
      return ''
    }).replace(/\.\//, '');

    arrayPush.apply( result, _sanitizePath(path, i, i === last) );

    return result

  }, []).join('/')
}

function _unraise (paths) {
  var result = [];

  paths.forEach(function (path) {
    if( !path ) return

    // https://jsperf.com/array-prototype-push-apply-vs-concat/17
    if( path instanceof Array ) arrayPush.apply(result, _unraise(path) );
    else if( typeof path === 'string' ) result.push(path);
    else throw new Error('paths parts should be Array or String')
  });

  return result
}

function joinPaths () {
  return _joinPaths( _unraise(arraySlice.call(arguments)) )
}

function plainOptions (_options_pile, _method) {
  var options_pile = _options_pile ? copy(_options_pile) : [];

  var plain_options = {},
      options = options_pile.shift();

  while( options ) {
    merge(plain_options, options, true);
    options = options_pile.shift();
  }

  // if(method) plain_options.method = method;

  // plain_options.url = joinPaths( _options_pile.reduce(function (paths, options) {
  //   if( !options.url ) return paths;
  //
  //   if( options.url instanceof Function ) return paths.concat( options.url(plain_options) );
  //
  //   return paths.concat(options.url);
  // }, []) );

  return plain_options
}

function _keysTobrackets (keys) {
  return keys.reduce(function (result, key, i) {
    return result + (i ? ( '[' + key + ']' ) : key)
  }, '')
}

function _serialize (data, params, keys) {

  if( typeof data === 'object' ) {
    if( Array.isArray(data) ) {
      for( var i = 0, n = data.length; i < n ; i++ ) {
        _serialize( data[i], params, keys.concat( typeof data[i] === 'object' ? i : '' ) );
      }
    } else {
      for( var k in data ) {
        _serialize( data[k], params, keys.concat(k) );
      }
    }
  } else {
    params.push( _keysTobrackets(keys) + '=' + encodeURIComponent('' + data) );
    // params.push( keysTobrackets(keys) + '=' + '' + data );
  }

  return params
}

function serialize (data) {
  // eslint-disable-next-line
  // console.log('serialize', data, _serialize(data, [], []) );
  return _serialize(data, [], []).join('&')
}

var http_defaults = {},
    _makeRequest = function () {};

var Parole = typeof Promise !== 'undefined' ? Promise : function () {};

function _getInterceptorsProcessor (interceptors, resolve, reject, is_error) {
  var running_error = is_error === true;

  function _processInterceptor (_res, interceptor) {
    if( !interceptor ) return (running_error ? reject : resolve)(_res)

    var result = undefined;

    try{
      result = interceptor(_res);
      if( result === undefined ) result = _res;
      else running_error = false;
    } catch (err) {
      result = err;
      running_error = true;
    }

    if( running_error !== is_error ) (running_error ? reject : resolve)(_res);
    else _processInterceptor(result, interceptors.shift());
  }

  return function (res) {
    _processInterceptor( res, interceptors.shift() );
  }
}

var isBlob = typeof Blob === 'function' ? function (x) {
  return Blob.prototype.isPrototypeOf(x)
} : function () { return false };

var isFormData = typeof FormData === 'function' ? function (x) {
  return FormData.prototype.isPrototypeOf(x)
} : function () { return false };

function http (url, _config, data) {
  if( isPlainObject(url) ) {
    data = _config;
    _config = url;
    url = null;
  }

  var config = plainOptions([http_defaults, _config || {}, url ? { url: isArray(url) ? url : [url] } : {}]);

  // console.log('http.headers', config.headers, [http_defaults, _config || {}, url ? { url: isArray(url) ? url : [url] } : {}] )

  if( config.url instanceof Array ) config.url = joinPaths( config.url.map(function (_path_part) {
    if( isFunction(_path_part) ) _path_part = _path_part(config);
    if( !isString(_path_part) ) throw new TypeError('url_part should be a String')
    return _path_part
  }) );

  config.method = config.method ? config.method.toUpperCase() : 'GET';
  config.timestamp = new Date().getTime();

  if( !isString(config.url) ) throw new Error('url must be a string')

  data = data || config.data || config.json;

  var is_json = data && ( 'json' in config || (
    typeof data === 'object' && !isBlob(data) && !isFormData(data)
  ) );

  config.body = is_json && typeof data !== 'string' ? JSON.stringify(data) : data;

  var interceptors = config.interceptors || [];
  delete config.interceptors;

  config = resolveFunctions(config, [config]);

  if( config.params ) {
    config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serialize( config.params );
  }

  var headers = copy(config.headers || {}, 'underscore');

  if( config.auth ) {
    if( !isString(config.auth.user) ) throw new TypeError('auth.user should be a String')
    if( !isString(config.auth.pass) ) throw new TypeError('auth.pass should be a String')

    headers.authorization = 'Basic ' + btoa(config.auth.user + ':' + config.auth.pass);
  }

  if( is_json && !headers.content_type ) headers.content_type = 'application/json';
  if( 'content_type' in headers && !headers.content_type ) delete headers.content_type;

  // headers.accept = headers.accept || headers.content_type || 'application/json'

  config.headers = copy(headers, 'header');

  var req_interceptors = [],
      // req_error_interceptors = [],
      res_interceptors = [],
      res_error_interceptors = [];

  interceptors.forEach(function (interceptor) {
    if( interceptor.request ) req_interceptors.push(interceptor.request);
    // if( interceptor.requestError ) req_error_interceptors.push(interceptor.requestError);
    if( interceptor.response ) res_interceptors.push(interceptor.response);
    if( interceptor.responseError ) res_error_interceptors.push(interceptor.responseError);
  });

  var request = null;

  var controller = new Parole(function (resolve, reject) {
        if( req_interceptors.length ) _getInterceptorsProcessor(req_interceptors, resolve, reject)(config);
        else resolve(config);
      })
      .then(function (config) {
        return new Parole(function (resolve, reject) {
          request = _makeRequest(config,
            res_interceptors.length ? _getInterceptorsProcessor(res_interceptors, resolve, reject, false) : resolve,
            res_error_interceptors.length ? _getInterceptorsProcessor(res_error_interceptors, resolve, reject, true) : reject
          );
        })
      });

  controller.config = config;

  controller.abort = function () {
    if( request ) request.abort();
  };

  return controller
}

http.responseData = function (response) {
  return response.data
};

var _concat = Array.prototype.concat;

function _httpBase (target, options, options_pile) {
  var _requestMethod = function (method, has_data) {
    return has_data ? function (url, data, _options) {

      if( isPlainObject(url) ) {
        _options = data;
        data = url;
        url = null;
      }

      return http( plainOptions(
        _concat.call(options_pile, _options || {}, url ? {
          method: method,
          data: data,
          url: isArray(url) ? url : [url]
        } : { method: method, data: data })
      ), data )

    } : function (url, _options) {

      if( isPlainObject(url) ) {
        _options = url;
        url = null;
      }

      return http( plainOptions(
        _concat.call(options_pile, _options || {}, url ? {
          method: method,
          url: isArray(url) ? url : [url]
        } : { method: method })
      ) )

    }
  };

  return extend(target, {
    head: _requestMethod('head'),
    get: _requestMethod('get'),
    post: _requestMethod('post', true),
    put: _requestMethod('put', true),
    patch: _requestMethod('patch', true),
    delete: _requestMethod('delete'),
    options: _requestMethod('options'), // for node
    base: function (url, _options) {
      var options = _options ? copy(_options) :{};
      if( url ) options.url = isArray(url) ? url : [url];
      return _httpBase( _requestMethod('get'), options, options_pile.concat(options) )
    },
    config: function (_options) {
      if( _options === undefined ) return plainOptions( options_pile.concat(options) )
      merge( options, _options );
    },
    addInterceptor: function (interceptor_definitions) {
      options.interceptors = options.interceptors || [];
      options.interceptors.push(interceptor_definitions);
    },
    responseData: http.responseData,
    useRequest: function (__makeRequest) {
      if( !isFunction(__makeRequest) ) throw new Error('_makeRequest should be a function')
      _makeRequest = __makeRequest;
      return target
    },
  })
}

http.base = _httpBase;
_httpBase(http, http_defaults, []);

http.usePromise = function (P) { Parole = P; return http };
http.useRequest = function (__makeRequest) {
  if( !isFunction(__makeRequest) ) throw new Error('_makeRequest should be a function')
  _makeRequest = __makeRequest;
  return http
};

http.config = function (options) {
  merge( http_defaults, options );
  return http
};

module.exports = http;
