// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core-test/sync'),
    Tiki = require('../lib/spade').Tiki;

// ..........................................................
// BASIC REQUIRE
// 

Ct.module('spade: basic require');

Ct.setup(function(t) {
  t.spade = new Tiki(); 
  
  // preload a module
  t.spade.register('foo', function(r,m,e) { e.id = 'foo'; });
  
  // dummy loader loads only foo/bar on demand
  t.spade.loader = {
    
    requests: 0, 
    
    loadFactory: function(spade, id, done) {
      this.requests++;
      if (id === '(default):foo/bar') {
        spade.register(id, function(r,m,e) { e.id='foo/bar'; });
      }
      if (done) throw "should not be passed done"
    }
  };
  
});

Ct.teardown(function(t) { 
  delete t.spade;
});

Ct.test('should not talk to loader if module is registered', function(t) {
  var spade = t.spade;
  t.equal(spade.require('foo').id, 'foo', 'should find foo');
  t.equal(spade.loader.requests, 0, 'loader should not have been called');
});

Ct.test('should let loader register', function(t) {
  var spade = t.spade;
  t.equal(spade.require('foo/bar').id, 'foo/bar', 'should find foo');
  t.equal(spade.loader.requests, 1, 'loader should have been called');
});

Ct.test('should throw if loader does not register', function(t) {
  var spade = t.spade;
  t.throws(function() {
    spade.require('imaginary/bar');
  });
  t.equal(spade.loader.requests, 1, 'loader should have been called');
});



Ct.run();
