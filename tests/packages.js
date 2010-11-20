// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core-test/sync'),
    Tiki = require('../lib/tiki').Tiki;

Ct.module('tiki: packages');

Ct.setup(function(t) {
  t.tiki = new Tiki(); 
});

Ct.teardown(function(t) { 
  delete t.tiki;
});

Ct.test('should find registered package', function(t) {
  
  var tiki = t.tiki;
  tiki.register('PKG', { name: 'PKG' });
  
  t.equal(tiki.packageFor('PKG').name, 'PKG');
  t.equal(tiki.packageFor('PKG:foo/bar').name, 'PKG');
  
  
});

Ct.test('should respect mappings', function(t) {
  
  var tiki = t.tiki;
  tiki.register('PKG', { mappings: { foo: 'FOO' } });
  
  tiki.register('PKG:bar', function(require, module, exports) {
    exports.id = require('foo:foo').id;
  });
  
  tiki.register('FOO:foo', function(r, m, e) { e.id = 'FOO'; });
  
  t.equal(tiki.require('PKG:bar').id, 'FOO'); // should remap pkg name
  
});


Ct.run();
