'use strict';

const path = require('path');
const fs = require('fs');
const router = require('./lib/router');
const debug = require('debug')('koa-grace:router');

/**
 * 生成路由控制
 * @param  {string} app     context
 * @param  {object} options 配置项
 *         {string} options.root controller路径
 *         {string} options.defualt_jump 如果访问路径为纯域名是否做跳转，默认为false
 *         {string} options.default_path 默认路径
 *         {string} options.domain 请求域名,可不传
 * @return {function}       
 */
function graceRouter(app, options) {
  if (typeof options === 'string') {
    options = {
      root: options
    };
  } else if (!options || !options.root) {
    throw new Error('`root` config required.');
  }

  const Router = router(options);
  const Domain = options.domain || '';

  // app的默认路由
  if (options.default_jump !== false && options.default_path) {
    Router.redirect('/', options.default_path);
  }

  let root = options.root;

  // 如果root不存在则直接跳过
  if (!fs.existsSync(root)) {
    debug('error : can\'t find route path ' + root);
    return function* ctrl(next) { yield next; };
  }

  _ls(root).forEach(function(filePath) {
    if (!/([a-zA-Z0-9_\-]+)(\.js)$/.test(filePath)) {
      return;
    }

    let exportFuncs = require(filePath);
    let pathRegexp = _formatPath(filePath, root);

    getRoute(exportFuncs, function(exportFun, ctrlpath) {
      _setRoute(Router, {
        domain: Domain,
        method: exportFun.__method__,
        regular: exportFun.__regular__,
        ctrlpath: ctrlpath,
        ctrl: exportFun
      }, options);
    }, [pathRegexp]);
  });

  // 添加bindDefault方法
  // 如果defaultCtrl文件存在则注入，否则忽略
  let deafaultCtrlRoot = options.deafaultCtrlRoot || options.root;
  deafaultCtrlRoot += '/defaultCtrl.js';
  app.context.__defineGetter__("bindDefault", () => {
    if (fs.existsSync(deafaultCtrlRoot)) {
      return require(deafaultCtrlRoot);
    } else {
      return function*() {
        debug(`Cannot find default controller '${deafaultCtrlRoot}'`)
      }
    }
  });

  return function* graceRouter(next) {
    yield Router.routes();
    yield next;
  }
};

/**
 * 递归生成路由，层级不超过3级
 * @param  {Object|Function}  exportFuncs 获取到的路由
 * @param  {Array}            ctrlpath    路由记录
 * @return
 */
function getRoute(exportFuncs, cb, ctrlpath, curCtrlname) {
  ctrlpath = ctrlpath || [];

  // 如果当前设置了不是路由，则直接返回
  if (exportFuncs.__controller__ === false) {
    return;
  }

  let totalCtrlname = curCtrlname ? ctrlpath.concat([curCtrlname]) : ctrlpath;

  // 只允许3级路由层级
  if (ctrlpath.length > 3) {
    debug(`嵌套路由对象层级不能超过3级：${totalCtrlname.join('/')}`);
    return;
  }

  // 如果是一个方法就直接执行cb
  if (typeof exportFuncs === 'function') {
    cb(exportFuncs, totalCtrlname);
  } else {
    // 否则进行循环递归查询
    for (let ctrlname in exportFuncs) {
      if (!exportFuncs.hasOwnProperty(ctrlname)) {
        continue
      }

      getRoute(exportFuncs[ctrlname], cb, totalCtrlname, ctrlname);
    }
  }
}

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
    dir = path.join(process.cwd(), root);
  }

  // 修复windows下的\路径问题
  dir = dir.replace(/\\/g, '/');

  return filePath
    .replace(/\\/g, '/')
    .replace(dir, '')
    .split('.')[0];
}

/**
 * 设置路由
 * @param {string} path 当前文件路径
 * @param {object} config  配置项
 *        {string} config.method 当前请求方法：get,post等
 *        {string} config.regular 参考：https://github.com/alexmingoia/koa-router#nested-routers
 *        {string} config.ctrlname 当前controller名称
 *        {funtion} config.ctrl controller方法
 * @param {Obejct} options grace router配置
 */
function _setRoute(Router, config, options) {
  let paths = [];
  let method = config.method || 'get';
  let ctrlpath = config.ctrlpath.join('/')

  // 加入当前路由
  paths.push(ctrlpath)

  // 如果当前路由配置方案为不跳转，则设置路由'/'为options.default_path路由
  if (options.default_jump === false && ctrlpath == options.default_path) {
    paths.push('/');
  }

  // 如果当前路由是以index结尾，则把其服路由也加入路由
  if (config.ctrlpath.slice(-1)[0] === 'index') {
    let parpath = config.ctrlpath.slice(0, -1);
    paths.push(parpath.join('/'));
  }

  // 如果有regular则加入regular路由
  if (config.regular) {
    paths.push(ctrlpath + config.regular);
  }

  // 注入路由
  paths.forEach(function(pathItem) {
    debug(method + ':' + config.domain + pathItem);

    Router[method](pathItem, config.ctrl);
  });
}

module.exports = graceRouter;
