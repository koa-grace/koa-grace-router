var koa = require('koa');
var router = require('..');

var app = koa();

app.use(router(app, {
  root: './example/controller',
  errorPath: '/error/404',
  default_path: '/index/index',
  default_jump: false
}));

app.listen(3000, function() {
  console.log('Listening on 3000!');
});
