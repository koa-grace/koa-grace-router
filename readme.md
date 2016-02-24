## koa-grace-router

[![Build Status](https://travis-ci.org/TheNodeILs/opinion.png?branch=master "Build Status")](https://travis-ci.org/TheNodeILs/opinion) 

File/Folder as `path`, another router middleware for koa.

### Install

    $ npm install koa-grace-router --save

### Usage

```
router(app, options)
```
- app: {Object} koa instance.
- options: {Object|String->root}
  - root: {String} router directory

### Example

**File tree**

```
├── app.js
└── controller
    ├── deal
    │   ├── index.js
    │   └── refund.js
    ├── index.js
    └── test.js
```


**app.js**

```
var koa = require('koa');
var router = require('koa-grace-router');

app.use(router(app, {
  root: './example/controller'
}));

app.listen(3000);
```

### Test

    npm test

### License

MIT
