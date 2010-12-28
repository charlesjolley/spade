// ==========================================================================
// Project:   Spade - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core-test/sync'),
    Spade = require('spade').Spade;

// ..........................................................
// BASIC REQUIRE
// 

Ct.module('spade: basic require');

Ct.setup(function(t) {
  t.spade = new Spade(); 
});

Ct.teardown(function(t) { 
  delete t.spade;
});


Ct.test('register then require a module', function(t) {
  var spade = t.spade;
  
  spade.register('foo/bar', function(require, exports) { 
    exports.foo = 'bar';
  });
  
  var exp = spade.require('foo/bar');
  t.equal(exp.foo, 'bar', 'exports.foo == bar - means require succeeded');  
});

Ct.test('register a string factory then require', function(t) {
  var spade = t.spade;
  
  spade.register('foo/bar', "exports.foo = 'bar';");
  
  var exp = spade.require('foo/bar');
  t.equal(exp.foo, 'bar', 'exports.foo == bar - means require succeeded');  
});

Ct.test('require a non-existant module will throw an exception', function(t) {
  var spade = t.spade;
  t.throws(function() {
    spade.require('imaginary/foo');
  }, spade.NotFoundError);
});

Ct.test('require a module that was just registered symbolically.  This is for compatibility with non-module items', function(t) {
  var spade = t.spade;
  spade.register('not/a-module');
  t.ok(spade.require('not/a-module'));
});
