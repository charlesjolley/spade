
require('./ruby_console');
module.exports = $rubyConsole;
if ('undefined' === typeof console) console = $rubyConsole;
