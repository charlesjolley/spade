// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core-test'),
    Tiki = require('../lib/tiki').Tiki;

// ..........................................................
// BASIC REQUIRE
// 

Ct.module('tiki: async require');

Ct.setup(function(t, done) {
  t.tiki = new Tiki(); 
  
  // preload a module
  t.tiki.register('foo/baz', function(require,m,e) { 
    e.id = 'foo/baz'; 
    e.async = require.async; // export for testing
  });
  
  // dummy loader loads only foo/bar on demand after delay
  t.tiki.loader = {
    
    requests: 0, 
    
    loadFactory: function(tiki, id, done) {
      this.requests++;
      if (id === '(default):foo/bar') {
        setTimeout(function() {
          tiki.register(id, function(r,m,e) { e.id='foo/bar'; });
          done();
        }, 10);

      } else {
        done('Not Found'); // immediately
      }
    }
  };
  
  done();
});

Ct.teardown(function(t, done) { 
  delete t.tiki;
  done();
});

Ct.test('should not talk to loader if registered', function(t, done) {
  var tiki = t.tiki;

  t.timeout(1000);
  
  tiki.async('foo/baz', function(err) {
    t.equal(err, null);
    t.equal(tiki.loader.requests, 0, 'loader should not have been called');
    t.equal(tiki.require('foo/baz').id, 'foo/baz', 'should find foo');
    done();
  });
  
});

Ct.test('should let loader register', function(t, done) {
  var tiki = t.tiki;
  t.timeout(1000);
  tiki.async('foo/bar', function(err) {
    t.equal(err, null);
    t.equal(tiki.loader.requests, 1, 'loader should have been called');
    t.equal(tiki.require('foo/bar').id, 'foo/bar', 'should find foo');
    done();
  });
});


Ct.test('should normalize id', function(t, done) {
  var tiki = t.tiki;
  t.timeout(1000);
  tiki.async('/./foo/baz/../bar', function(err) {
    t.equal(err, null);
    t.equal(tiki.loader.requests, 1, 'loader should have been called');
    t.equal(tiki.require('foo/bar').id, 'foo/bar', 'should find foo');
    done();
  });
});


Ct.test('should expose async inside of module', function(t, done) {
  var tiki = t.tiki;
  t.timeout(1000);

  var async = tiki.require('foo/baz').async;
  t.ok(async, 'should have an async function');
  
  // normalize relative to async
  async('./bar', function(err) {
    t.equal(err, null);
    t.equal(tiki.loader.requests, 1, 'loader should have been called');
    t.equal(tiki.require('foo/bar').id, 'foo/bar', 'should find foo');
    done();
  });
});


Ct.test('should return err if loader does not register', function(t, done) {
  var tiki = t.tiki;
  t.timeout(1000);
  tiki.async('imaginary/bar', function(err) {
    t.equal(err, 'Not Found');
    t.equal(tiki.loader.requests, 1, 'loader should have been called');

    t.throws(function() {
      tiki.require('imaginary/bar');
    });
    done();
  });
  
});



Ct.run();
