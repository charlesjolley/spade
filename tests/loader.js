// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core-test/sync'),
    Tiki = require('../lib/tiki').Tiki;

// ..........................................................
// BASIC REQUIRE
// 

Ct.module('tiki: basic require');

Ct.setup(function(t) {
  t.tiki = new Tiki(); 
  
  // preload a module
  t.tiki.register('foo', function(r,m,e) { e.id = 'foo'; });
  
  // dummy loader loads only foo/bar on demand
  t.tiki.loader = {
    
    requests: 0, 
    
    loadFactory: function(tiki, id, done) {
      this.requests++;
      if (id === '(default):foo/bar') {
        tiki.register(id, function(r,m,e) { e.id='foo/bar'; });
      }
      if (done) throw "should not be passed done"
    }
  };
  
});

Ct.teardown(function(t) { 
  delete t.tiki;
});

Ct.test('should not talk to loader if module is registered', function(t) {
  var tiki = t.tiki;
  t.equal(tiki.require('foo').id, 'foo', 'should find foo');
  t.equal(tiki.loader.requests, 0, 'loader should not have been called');
});

Ct.test('should let loader register', function(t) {
  var tiki = t.tiki;
  t.equal(tiki.require('foo/bar').id, 'foo/bar', 'should find foo');
  t.equal(tiki.loader.requests, 1, 'loader should have been called');
});

Ct.test('should throw if loader does not register', function(t) {
  var tiki = t.tiki;
  t.throws(function() {
    tiki.require('imaginary/bar');
  });
  t.equal(tiki.loader.requests, 1, 'loader should have been called');
});



Ct.run();
