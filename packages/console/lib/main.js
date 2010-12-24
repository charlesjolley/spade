if ('undefined' === typeof console) console = require('./ruby_console');
__module.exports = console;
console.VERSION = __module.package.version;

