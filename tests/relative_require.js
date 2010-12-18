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

Ct.module('spade: relative require');

Ct.setup(function(t) {
  t.spade = new Tiki(); 
  
  // register some dummy modules.  These will just set an 'id' prop on exports
  ['foo/bar', 'bar', 'foo/bar/baz'].forEach(function(id) {
    t.spade.register(id, function(r,m,e) { e.id = id; });
  });
  
});

Ct.teardown(function(t) { 
  delete t.spade;
});

Ct.test('require absolute', function(t) {
  var spade = t.spade;
  spade.register('blah', function(require, m, e) { 
    e.found = require('foo/bar').id; 
  });
  
  t.equal(spade.require('blah').found, 'foo/bar');
});

Ct.test('require relative top level', function(t) {
  var spade = t.spade;
  spade.register('blah', function(require, m, e) { 
    e.found = require('./bar').id; 
  });
  
  t.equal(spade.require('blah').found, 'bar');
});

Ct.test('require relative nested', function(t) {
  var spade = t.spade;
  spade.register('foo/blah', function(require, m, e) { 
    e.found = require('./bar').id; 
  });
  
  t.equal(spade.require('foo/blah').found, 'foo/bar');
});

Ct.test('require relative  up nested', function(t) {
  var spade = t.spade;
  spade.register('bar/blah', function(require, m, e) { 
    e.found = require('../foo/bar/baz').id; 
  });
  
  t.equal(spade.require('bar/blah').found, 'foo/bar/baz');
});


Ct.run();
