/*
    This is an example of the same unit test written using the native CoreTest
    API.  The big benefit of the native CoreTest API is that it is fully 
    async so it is easy to test event driven code with it.  
    
    For a sync version of this same API (does not require invoking a callback
    when )
*/
/*globals Ct */

require('core-test');

Ct.module('Qunit Example');

// NOTE:  T is the test instance.  A new one is passed for each test which is
// good since previous tests could impact future ones when running async
Ct.setup(function(T, done) {
  T.foo = 'foo';
  done();
});
  
Ct.teardown(function(T, done) {
  T.foo = 'unfoo';
  done();
});

Ct.test('T.foo should be foo', function(T, done) {
  T.equal(T.foo, 'foo', 'T.foo should be set');
  done();
});

Ct.test('async example', function(T, done) {
  setTimeout(function() {
    T.ok(true, 'async test did fire');
    done(); // invoke when you are finished running this test
  }, 100);
});

Ct.run();
