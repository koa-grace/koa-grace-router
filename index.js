'use strict';

const path = require('path');
const fs = require('fs');
const router = require('koa-router');
const debug = require('debug')('koa-grace:router');

/**
 * 生成路由控制
 * @param  {string} app     context
 * @param  {object} options 配置项
 *         {string} options.root controller路径
 *         {string} options.default_path 默认路径
 *         {string} options.domain 请求域名,可不传
 * @return {function}       
 */
function graceRouter(app, options) {
  const Router = router();

  const Domain = options.domain || '';

  // app的默认路由
  if (options.default_path) {
    Router.redirect('/', options.default_path);
  }

  if (typeof options === 'string') {
    options = {
      root: options
    };
  } else if (!options || !options.root) {
    throw new Error('`root` config required.');
  }

  let root = options.root;
  _ls(root).forEach(function(filePath) {
    if (!/([a-zA-Z0-9_\-]+)(\.js)$/.test(filePath)) {
      return;
    }

    let exportFuncs = require(filePath);
    let pathRegexp = _formatPath(filePath, root);

    // 如果当前设置了不是路由，则暂停
    if (exportFuncs.__controller__ === false) {
      return;
    }

    let ctrlMethod = exportFuncs.__method__;
    let ctrlRegular = exportFuncs.__regular__;

    if (typeof exportFuncs === 'function') {
      _setRoute(Router, pathRegexp, {
        domain: Domain,
        method: ctrlMethod,
        ctrl: exportFuncs,
        regular: ctrlRegular
      });
    } else {
      for (let ctrlname in exportFuncs) {
        if (typeof exportFuncs[ctrlname] !== 'function') {
          continue;
        }

        _setRoute(Router, pathRegexp, {
          domain: Domain,
          method: exportFuncs[ctrlname].__method__ || ctrlMethod,
          regular: exportFuncs[ctrlname].__regular__ || ctrlRegular,
          ctrlname: ctrlname,
          ctrl: exportFuncs[ctrlname]
        });
      };
    }

    // app.use(Router.routes());
  });

  // 添加bindDefault方法
  let deafaultCtrlRoot = options.deafaultCtrlRoot || options.root;
  deafaultCtrlRoot += '/defaultCtrl';
  app.context.__defineGetter__("bindDefault", function() {
    return require(deafaultCtrlRoot);
  });

  return Router.routes();
};


/**
 * 查找目录中的所有文件
 * @param  {string} dir       查找路径
 * @param  {init}   _pending  递归参数，忽略
 * @param  {array}  _result   递归参数，忽略
 * @return {array}            文件list
 */
function _ls(dir, _pending, _result) {
  _pending = _pending ? _pending++ : 1;
  _result = _result || [];

  if (!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir);
  }

  // if error, throw it
  let stat = fs.lstatSync(dir);

  if (stat.isDirectory()) {
    let files = fs.readdirSync(dir);
    files.forEach(function(part) {
      _ls(path.join(dir, part), _pending, _result);
    });
    if (--_pending === 0) {
      return _result;
    }
  } else {
    _result.push(dir);
    if (--_pending === 0) {
      return _result;
    }
  }
};

/**
 * 格式化文件路径为koa-router的path
 * @param  {string} filePath 文件路径
 * @param  {string} root     router路径
 * @return {string}          过滤之后的path
 */
function _formatPath(filePath, root) {
  let dir = root;

  if (!path.isAbsolute(root)) {
    dir = path.join(process.cwd(), root)
  }

  return filePath
    .replace(dir, '')
    .replace(/\\/g, '/')
    .split('.')[0];
}

/**
 * 设置路由
 * @param {string} path 当前文件路径
 * @param {object} opt  配置项
 *        {string} opt.method 当前请求方法：get,post等
 *        {string} opt.regular 参考：https://github.com/alexmingoia/koa-router#nested-routers
 *        {string} opt.ctrlname 当前controller名称
 *        {funtion} opt.ctrl controller方法
 */
function _setRoute(Router, path, opt) {
  let paths = [];
  let method = opt.method || 'get';
  let pathname = opt.ctrlname ? (path + '/' + opt.ctrlname) : path;

  // 真实路由
  paths.push(pathname);

  // 如果配置了regular则配置regular路由，例如：/post的regular为/:id,则添加一个/post/:id的路由
  opt.regular && paths.push(pathname + opt.regular);

  // 如果是index就是当前路径的默认路由
  opt.ctrlname === 'index' && paths.push(path);

  // 注入路由
  paths.forEach(function(pathItem) {
    debug(method + ':' + opt.domain + pathItem);

    Router[method](pathItem, opt.ctrl);
  });

  return;
}

module.exports = graceRouter
