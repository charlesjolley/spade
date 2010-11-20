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
});

Ct.teardown(function(t) { 
  delete t.tiki;
});


Ct.test('register then require a module', function(t) {
  var tiki = t.tiki;
  
  tiki.register('foo/bar', function(require, module, exports) { 
    exports.foo = 'bar';
  });
  
  var exp = tiki.require('foo/bar');
  t.equal(exp.foo, 'bar', 'exports.foo == bar - means require succeeded');  
});

Ct.test('register a string factory then require', function(t) {
  var tiki = t.tiki;
  
  tiki.register('foo/bar', "exports.foo = 'bar';");
  
  var exp = tiki.require('foo/bar');
  t.equal(exp.foo, 'bar', 'exports.foo == bar - means require succeeded');  
});

Ct.test('require a non-existant module will throw an exception', function(t) {
  var tiki = t.tiki;
  t.throws(function() {
    tiki.require('imaginary/foo');
  }, tiki.NotFoundError);
});

Ct.test('require a module that was just registered symbolically.  This is for compatibility with non-module items', function(t) {
  var tiki = t.tiki;
  tiki.register('not/a-module');
  t.ok(tiki.require('not/a-module'));
});


Ct.run();
