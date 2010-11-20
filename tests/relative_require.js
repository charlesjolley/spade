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

Ct.module('tiki: relative require');

Ct.setup(function(t) {
  t.tiki = new Tiki(); 
  
  // register some dummy modules.  These will just set an 'id' prop on exports
  ['foo/bar', 'bar', 'foo/bar/baz'].forEach(function(id) {
    t.tiki.register(id, function(r,m,e) { e.id = id; });
  });
  
});

Ct.teardown(function(t) { 
  delete t.tiki;
});

Ct.test('require absolute', function(t) {
  var tiki = t.tiki;
  tiki.register('blah', function(require, m, e) { 
    e.found = require('foo/bar').id; 
  });
  
  t.equal(tiki.require('blah').found, 'foo/bar');
});

Ct.test('require relative top level', function(t) {
  var tiki = t.tiki;
  tiki.register('blah', function(require, m, e) { 
    e.found = require('./bar').id; 
  });
  
  t.equal(tiki.require('blah').found, 'bar');
});

Ct.test('require relative nested', function(t) {
  var tiki = t.tiki;
  tiki.register('foo/blah', function(require, m, e) { 
    e.found = require('./bar').id; 
  });
  
  t.equal(tiki.require('foo/blah').found, 'foo/bar');
});

Ct.test('require relative  up nested', function(t) {
  var tiki = t.tiki;
  tiki.register('bar/blah', function(require, m, e) { 
    e.found = require('../foo/bar/baz').id; 
  });
  
  t.equal(tiki.require('bar/blah').found, 'foo/bar/baz');
});


Ct.run();
