exports.aj = {
  aj_1: function() {
    this.body = {
      message: 'aj_1'
    }
  },
  aj_2: {
    aj_2_1: function() {
      this.body = {
        message: 'aj_2_1'
      }
    },
    aj_2_2: function() {
      this.body = {
        message: 'aj_2_2'
      }
    }
  },
  aj_3: {
    aj_3_1: {
    	// 该路由层级超过三级，生成路由失败
    	aj_3_1_1 : function(){
    		this.body = {
    			message: 'aj_3_1_1'
    		}
    	}
    }
  }
}

exports.index = function*() {
  console.log(this.bindDefault)
  this.body = 'hello world!';
}
exports.test1 = function*() {
  this.body = 'test1';
}
exports.test2 = function*() {
  this.body = 'test2';
}
