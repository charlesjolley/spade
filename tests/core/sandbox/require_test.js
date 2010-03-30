// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('tiki:core'),
    Ct   = require('core_test:sync'),

    mocks = require('../../mocks'),
    MockPackage = mocks.MockPackage, 
    MockSource = mocks.MockSource;
    
Ct.module('Sandbox#require');

Ct.setup(function(t) {
  
  t.fooPkg = new MockPackage('foo', '2.0.0');
  t.fooPkg.mockModules('foo/bar', 'foo', 'foo/baz');

  t.bazPkg = new MockPackage('baz', '1.0.0');
  t.bazPkg.mockModules('foo/bar', 'foo', 'foo/baz');
  // 
  // // don't add to sources just yet - added by one unit test
  // t.barPkg = new MockPackage('bar', '2.1.0');
  // t.barPkg.mockModules('main');
  // 
  t.mockSource = new MockSource();
  t.mockSource.add(t.fooPkg).add(t.bazPkg);

  t.loader = new tiki.Loader([t.mockSource]);
  t.sandbox = new tiki.Sandbox(t.loader);
});

Ct.teardown(function(t) {
  var k = 'sandbox loader fooPkg bazPkg mockSource'.split(' '),
      loc = k.length;
  while(--loc>=0) delete t[k[loc]];
});

Ct.test('basic exports', function(t) {
  var exp = t.sandbox.require('foo/bar', 'foo', t.fooPkg);
  t.ok(exp, 'should return exports');
  t.equal(exp.moduleId, 'foo/bar', 'exp.moduleId');
});

Ct.test('non existant exports', function(t) {
  t.throws(function() {
    t.sandbox.require('foo/imaginary', 'foo', t.fooPkg);
  });
});

Ct.test('multiple calls should return same instance', function(t) {
  var mod1, mod2, mod3;
  
  mod1 = t.sandbox.require('baz:foo/bar', 'foo/bar', t.fooPkg);
  t.ok(mod1, 'should return module');
  t.ok(mod1.moduleId, 'foo/bar', 'moduleId');
  
  // same mod -- different starting point
  mod2 = t.sandbox.require('foo/bar', 'foo', t.bazPkg);
  t.strictEqual(mod2, mod1, 'should be same instance');
  
  // relative paths..
  mod3 = t.sandbox.require('../foo/bar', 'foo/baz', t.bazPkg);
  t.strictEqual(mod3, mod1, 'should be same instance');
  
});

Ct.test('test param normalization', function(t) {
  var mod1, mod2;
  
  mod1 = t.sandbox.require('::foo/2.0.0:foo/bar');
  t.ok(mod1);
  t.ok(mod1.moduleId, 'foo/bar', 'moduleId');
  
  mod2 = t.sandbox.require('foo:foo/bar');
  t.strictEqual(mod2, mod1, 'foo:foo/bar');

  mod2 = t.sandbox.require('foo/bar', null, t.fooPkg);
  t.strictEqual(mod2, mod1, 'foo/bar, null, fooPkg');

  mod2 = t.sandbox.require('foo/bar', t.fooPkg);
  t.strictEqual(mod2, mod1, 'foo/bar, fooPkg');

  mod2 = t.sandbox.require('./bar', 'foo/baz', t.fooPkg);
  t.strictEqual(mod2, mod1, './bar, foo/bar, fooPkg');
  
});

Ct.run();



