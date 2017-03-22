http-rest
================
[![Bower version](https://badge.fury.io/bo/http-rest.svg)](http://badge.fury.io/bo/http-rest)
[![npm version](https://badge.fury.io/js/http-rest.svg)](http://badge.fury.io/js/http-rest)
Installation
------------

### Node

``` sh
npm install http-rest --save
```
``` js
	var $http = require('http-rest');
```

### Browser

> Using node

``` js
	var $http = require('http-rest/browser');
```

> Using Bower

``` sh
	bower install http-rest --save
```

Usage
-----

``` js
// GET .../items?prop1=value1
$http.get('/items', { params: { prop1: value1 } });

$http.post('/items', {
	sample: 'payload'
});

$http.put('/items/:itemId', {
	sample: 'payload'
});

$http.patch('/items/:itemId', {
	sample: 'payload'
});

$http.delete('/items/:itemId');
```

Base configurations
-------------------------

``` js
var httpItems = $http.base('items');

httpItems.post({ prop1: 'value1' });

httpItems.get(itemId);

httpItems.put(itemId, {	prop1: 'another value' });

httpItems.delete(itemId);
```
