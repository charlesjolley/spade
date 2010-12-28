/*
  This is an example of a unit test using the CoreTest Qunit personality. To
  convert an existing Qunit test just add the core-test require to the top of 
  the file.  
*/

require('core-test/qunit');

var T = {};

module('Qunit Example', {
  setup: function() {
    T.foo = 'foo';
  },
  
  teardown: function() {
    T.foo = 'unfoo';
  }
});

test('T.foo should be foo', function() {
  equals(T.foo, 'foo', 'T.foo should be set');
});
