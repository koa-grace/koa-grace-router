module.exports = function*() {
  function getData() {
    return function(callback) {
      setTimeout(function() {
        callback(0, {
          userInfo : {
          	user_id : 0
          }
        });
      }, 3000)
    }
  }

  var data = yield getData();

  this.assert(this.state.user, 401, 'User not found. Please login!');

  this.backData = data;

}