exports.index = function* () {
	yield this.bindDefault();
    this.body = 'hello world!';
}
exports.index.method = 'get';