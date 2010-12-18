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

Ct.module('spade: normalize');

Ct.setup(function(t) {
  t.spade = new Tiki(); 
});

Ct.teardown(function(t) { 
  delete t.spade;
});

Ct.test('normalize', function(t) {
  var spade = t.spade;
  t.equal(spade.normalize('foo/bar'), 'foo/bar');
  t.equal(spade.normalize('./foo', 'bar/baz'), 'bar/foo');
  t.equal(spade.normalize('../foo', 'bar/baz'), 'foo/index');
  t.equal(spade.normalize('foo/../bar//foo/./baz', 'bar/baz'), 'bar/foo/baz');

  t.equal(spade.normalize('/foo/./bar'), 'foo/bar');
  t.equal(spade.normalize('foo/../bar/'), 'bar/index');
  t.equal(spade.normalize('/foo/../bar/'), 'bar/index');

  t.equal(spade.normalize('/foo/bar'), 'foo/bar');
  t.equal(spade.normalize('foo/bar/'), 'foo/bar');
  t.equal(spade.normalize('/foo/bar/'), 'foo/bar');
  
  t.equal(spade.normalize('PKG/foo/bar'), 'PKG/foo/bar');
  t.equal(spade.normalize('BAR/foo', 'PKG/bar/baz'), 'BAR/foo');
  t.equal(spade.normalize('./foo', 'PKG/bar/baz'), 'PKG/bar/foo');
  t.equal(spade.normalize('../foo', 'PKG/bar/baz'), 'PKG/foo');
  t.equal(spade.normalize('foo/../bar//foo/./baz', 'PKG/bar/baz'), 'PKG/bar/foo/baz');
  
});

Ct.test('normalize package', function(t) {
  var spade = t.spade;
  
  spade.register('sproutcore', {}); // register as a package
  t.equal(spade.normalize('sproutcore'), 'sproutcore/index');
  t.equal(spade.normalize('foo/sproutcore'), 'foo/sproutcore');
});



Ct.run();
