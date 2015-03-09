
(function (definition) {
    'use strict';
    
    if ( typeof window !== 'undefined' ) {
        if ( window.fn ) {
            fn.define('http', definition);
        } else if( !window.http ) {
            window.http = definition();
        }
    }

})(function () {
    'use strict';

    function extend () {
        var auxArray = [],
            dest = auxArray.shift.call(arguments),
            src = auxArray.shift.call(arguments),
            key;

        while( src ) {
            for( key in src ) {
                if( dest[key] instanceof Object && src[key] instanceof Object ) {
                    dest[key] = extend({}, src[key]);
                } else {
                    dest[key] = src[key];
                }
            }
            src = auxArray.shift.call(arguments);
        }

        return dest;
    }

    function toTitleSlug(text) {
        var key = text[0].toUpperCase() + text.substr(1);
        return key.replace(/([a-z])([A-Z])/, function (match, lower, upper) {
            return lower + '-' + upper;
        });
    }

    function toCamelCase(text) {
        var key = text[0].toLowerCase() + text.substr(1);
        return key.replace(/([a-z])-([A-Z])/, function (match, lower, upper) {
            return lower + upper;
        });
    }

    function processQueue (request, queue, data, resolved) {
        var step = queue.shift(),
            newData = undefined;


        if( !step ) {
            step = queue.$finally.shift();
        }

        if( step instanceof Function ) {

            step(data, request.status, request);

        } else if( step instanceof Object ) {

            if( resolved && step.resolve ) {
                newData = step.resolve(data, request.status, request);
            }

            if( !resolved && step.reject ) {
                newData = step.reject(data, request.status, request);
            }

            if( newData && newData.then ) {
                queue.forEach(function (step) {
                    newData.then(step.resolve, step.reject);
                });

                if( newData.finally ) {
                    queue.$finally.forEach(function (step) {
                        newData.finally(step.resolve, step.reject);
                    });
                } else if( queue.$finally.length ) {
                    throw 'received promise not implements finally';
                }

                step = false;
            }

        }

        if( step ) {
            processQueue(request, queue, (newData === undefined) ? data : newData, resolved);
        }
    }

    function processResponse (request, handlersQueue, catchCodes) {
        request.headers = {};
        request.getAllResponseHeaders().replace(/\s*([^\:]+)\s*\:\s*([^\;\n]+)/g, function (match, key, value) {
            request.headers[toCamelCase(key)] = value.trim();
        });

        var data = request.responseText;
        if( request.headers.contentType === 'application/json' ) {
            data = JSON.parse(data);
        }

        if( catchCodes[request.status] ) {
            catchCodes[request.status].apply(request, [ data, function (data) {
                processQueue(request, handlersQueue, data, true);
            }, function (reason) {
                processQueue(request, handlersQueue, reason, true);
            } ]);
        } else if( request.status >= 200 && request.status < 300 ) {
            request.$resolved = true;
            processQueue(request, handlersQueue, data, true);
        } else {
            processQueue(request, handlersQueue, data, false);
        }
    }

    function HttpUrl (url) {
        this.url = url;
    }

    ['get', 'head', 'options', 'post', 'put', 'delete', 'patch'].forEach(function (method) {
        HttpUrl.prototype[method] = function () {
            var args = [this.url];

            if( arguments.length ) {
                [].push.apply(args, arguments);
            } else {
                args.push({});
            }

            return http[method].apply(null, args);
        };
    });

    function http (url, _options){

        if( url instanceof Object ) {
            _options = url;
            url = _options.url;
        }

        if( !_options ) {
            return new HttpUrl(url);
        }

        var options = extend({}, http.defaults),
            key,
            catchCodes = {},
            handlersQueue = [];

        for( key in _options ) {
            if( _options[key] instanceof Function ) {
                _options[key] = _options[key]();
            }
            if( options[key] instanceof Function ) {
                options[key] = options[key]();
            }
            if( key !== 'data' && _options[key] instanceof Object ) {
                extend(options[key], _options[key])
            } else {
                options[key] = _options[key];
            }
        }

        if( !url ) {
            throw 'url missing';
            return false;
        }
        
        var request = null;
        try { // Firefox, Opera 8.0+, Safari
            request = new XMLHttpRequest();
        } catch (e) { // Internet Explorer
            try { request = new ActiveXObject("Msxml2.XMLHTTP"); }
            catch (e) { request = new ActiveXObject("Microsoft.XMLHTTP"); }
        }
        if (request===null) { throw "Browser does not support HTTP Request"; }

        request.open( options.method.toUpperCase(), url, (options.async === undefined) ? true : options.async );

        for( key in options.headers ) {
            request.setRequestHeader( toTitleSlug(key), options.headers[key]);
        }

        request.onreadystatechange=function(){
            if( request.readyState === 'complete' || request.readyState === 4 ) {
                processResponse(request, handlersQueue, catchCodes);
            }
        }

        if( options.data !== undefined && typeof options.data !== 'string' ) {
            options.data = JSON.stringify(options.data);
        }
        
        request.send( options.data );

        request.then = function (onFulfilled, onRejected) {
            if( onFulfilled instanceof Function ) {
                handlersQueue.push({ resolve: onFulfilled, reject: onRejected });
            }
            return request;
        };

        request.catch = function (onRejected) {
            if( onRejected instanceof Function ) {
                handlersQueue.push({ resolve: null, reject: onRejected });
            }
            return request;
        };

        handlersQueue.$finally = [];

        request.finally = function (onAlways) {
            handlersQueue.$finally.push(onAlways);
            return request;
        };

        return request;
    }

    http.defaults = {
        method: 'get',
        headers: {
            // accept: 'application/json',
            contentType: 'application/json'
        }
    };

    http.get = http;
    ['head', 'options', 'post', 'put', 'delete'].forEach(function (method) {
        http[method] = function (url, data, _options){

            if( url instanceof Object ) {
                _options = url;
                url = _options.url;
            }
            _options = _options || {};
            _options.data = data;
            _options.method = method;

            return http(url, _options);
        }
    });

    http.patch = function (url, data, options) {
        if( url instanceof Object ) {
            url.method = 'patch';
            return http(url);
        } else if( typeof url === 'string' ) {
            options = options instanceof Object ? options : {};

            if( data ) {
                return http(url, extend(options, {
                    method: 'patch',
                    data: data
                }) );
            } else {
                var patchOps = [],
                    addOp = function (patchOp) {
                        patchOps.push(patchOp);
                        return patchHandler;
                    },
                    patchHandler = {
                        add: function (path, value) {
                            return addOp({ op: 'add', path: path, value: value });
                        },
                        test: function (path, value) {
                            return addOp({ op: 'test', path: path, value: value });
                        },
                        replace: function (path, value) {
                            return addOp({ op: 'replace', path: path, value: value });
                        },
                        move: function (from, path) {
                            return addOp({ op: 'move', from: from, path: path });
                        },
                        copy: function (from, path) {
                            return addOp({ op: 'copy', from: from, path: path });
                        },
                        remove: function (path) {
                            return addOp({ op: 'remove', path: path });
                        },

                        flush: function () {
                            patchOps.splice(0, patchOps.length);
                            return patchHandler;
                        },

                        submit: function (data) {

                            data = data || patchOps;

                            return http(url, extend(options, {
                                method: 'patch',
                                data: data
                            }) );
                        }
                    };

                return patchHandler;
            }

        }
    };

    return http;
});
