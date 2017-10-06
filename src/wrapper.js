
import {copy, extend, merge, isObject, isString, isFunction, headersToTitleSlug, serializeParams, resolveFunctions} from './utils';

var httpDefaults = {},
    makeRequest = function () {},
    Parole = typeof Promise !== 'undefined' ? Promise : function () {};

function http (url, config, body) {

  config = copy( isObject(url) ? url : config || {} );
  config.url = url === config ? config.url : url;
  config.method = config.method ? config.method.toUpperCase() : 'GET';
  config.timestamp = new Date().getTime();
  config.body = body || config.body;

  if( !isString(config.url) ) throw new Error('url must be a string');

  config = resolveFunctions(config);

  if( config.params ) {
    config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serializeParams( config.params );
  }

  var headers = copy(config.headers || {});

  if( config.json && !config.body ) {
    headers.contentType = headers.contentType || 'application/json';
    config.body = JSON.stringify(config.json);
  } else if( headers.contentType === 'application/json' && typeof config.body === 'object' ) {
    config.body = JSON.stringify(config.json);
  } else if( typeof config.body === 'object' &&
      !Blob.prototype.isPrototypeOf(config.body) &&
      !FormData.prototype.isPrototypeOf(config.body) ) {
    config.body = JSON.stringify(config.body);
    headers.contentType = headers.contentType || 'application/json';
  } else if( !headers.contentType ) headers.contentType || 'application/json';

  headers.accept = headers.accept || headers.contentType || 'application/json';

  config.headers = headersToTitleSlug(headers);

  var request = new Parole(function (resolve, reject) {
    makeRequest(config, resolve, reject);
  });

  request.config = config;

  return request;
}

http.responseData = function (response) {
  return response.data;
};

function _plainOptions (optionsPile, method) {
  optionsPile = optionsPile ? copy(optionsPile) : [];

  var plainOptions = copy(httpDefaults),
      options = optionsPile.shift();

  while( options ) {
    merge(plainOptions, options);
    options = optionsPile.shift();
  }

  plainOptions.method = method;

  return plainOptions;
}

function useBasePath (_basePath) {
  return function (path) {
    return ( _basePath ? (_basePath.replace(/\/$/, '') + '/') : '' ) + ( path ? ( _basePath ? path.replace(/^\//, '') : path ) : '' );
  };
}

function httpBase (target, _basePath, optionsPile) {
  var fullPath = useBasePath(_basePath),
      requestMethod = function (method, hasData) {
        return hasData ? function (path, data, options) {
          return http( fullPath(path), _plainOptions( optionsPile.concat(options), method ), data );
        } : function (path, options, data) {
          return http( fullPath(path), _plainOptions( optionsPile.concat(options), method ), data );
        };
      };

  target = target || requestMethod('get');

  return extend(target, {
    head: requestMethod('head'),
    get: requestMethod('get'),
    post: requestMethod('post', true),
    put: requestMethod('put', true),
    patch: requestMethod('patch', true),
    delete: requestMethod('delete'),
    base: function (path, options) {
      return httpBase( target, fullPath(path), optionsPile.concat(options || {}) );
    },
    config: function (options) {
      if( options === undefined ) return _plainOptions( optionsPile );
      merge( optionsPile[optionsPile.length - 1], options );
    },
    responseData: http.responseData,
  });
}

http.base = httpBase;
httpBase(http, null, [{}]);

http.usePromise = function (P) { Parole = P; return http; };
http.useRequest = function (request) {
  if( !isFunction(request) ) throw new Error('request should be a function');
  else makeRequest = request;
  return http;
};

http.config = function (options) {
  merge( httpDefaults, options );
  return http;
};

export default http;
