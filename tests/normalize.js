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

Ct.module('tiki: normalize');

Ct.setup(function(t) {
  t.tiki = new Tiki(); 
});

Ct.teardown(function(t) { 
  delete t.tiki;
});

Ct.test('normalize', function(t) {
  var tiki = t.tiki;
  t.equal(tiki.normalize('foo/bar'), 'foo/bar');
  t.equal(tiki.normalize('./foo', 'bar/baz'), 'bar/foo');
  t.equal(tiki.normalize('../foo', 'bar/baz'), 'foo/index');
  t.equal(tiki.normalize('foo/../bar//foo/./baz', 'bar/baz'), 'bar/foo/baz');

  t.equal(tiki.normalize('/foo/./bar'), 'foo/bar');
  t.equal(tiki.normalize('foo/../bar/'), 'bar/index');
  t.equal(tiki.normalize('/foo/../bar/'), 'bar/index');

  t.equal(tiki.normalize('/foo/bar'), 'foo/bar');
  t.equal(tiki.normalize('foo/bar/'), 'foo/bar');
  t.equal(tiki.normalize('/foo/bar/'), 'foo/bar');
  
  t.equal(tiki.normalize('PKG/foo/bar'), 'PKG/foo/bar');
  t.equal(tiki.normalize('BAR/foo', 'PKG/bar/baz'), 'BAR/foo');
  t.equal(tiki.normalize('./foo', 'PKG/bar/baz'), 'PKG/bar/foo');
  t.equal(tiki.normalize('../foo', 'PKG/bar/baz'), 'PKG/foo');
  t.equal(tiki.normalize('foo/../bar//foo/./baz', 'PKG/bar/baz'), 'PKG/bar/foo/baz');
  
});

Ct.test('normalize package', function(t) {
  var tiki = t.tiki;
  
  tiki.register('sproutcore', {}); // register as a package
  t.equal(tiki.normalize('sproutcore'), 'sproutcore/index');
  t.equal(tiki.normalize('foo/sproutcore'), 'foo/sproutcore');
});



Ct.run();
