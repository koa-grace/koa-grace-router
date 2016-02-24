exports.index = function* () {
	console.log(this.bindDefault)
    this.body = 'hello world!';
}
exports.test1 = function* () {
    this.body = 'test1';
}
exports.test2 = function* () {
    this.body = 'test2';
}