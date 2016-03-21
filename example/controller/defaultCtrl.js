module.exports = function*() {
  function getData() {
    return function(callback) {
      setTimeout(function() {

        console.log('this is defaultCtrl');

        callback(0, {
          userInfo : {
          	user_id : 0
          }
        });
      }, 3000)
    }
  }

  var data = yield getData();

  this.backData = data;

}