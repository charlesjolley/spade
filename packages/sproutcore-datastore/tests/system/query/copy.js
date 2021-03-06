// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2010 Apple Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

require('core-test/qunit');
require('sproutcore-datastore/query');
require('sproutcore-datastore/store');
require('sproutcore-datastore/record');

// test parsing of query string
module("SC.Query#copy");

test("basic copy", function() {
  var q=  SC.Query.create({
    conditions: "foo = bar",
    parameters: { foo: "bar" },
    orderBy: "foo",
    recordType: SC.Record,
    recordTypes: [SC.Record],
    location: SC.Query.REMOTE,
    scope: SC.CoreSet.create()
  }).freeze();
  
  var keys = 'conditions orderBy recordType recordTypes parameters location scope'.w();
  var copy = q.copy();
  
  equals(copy.isFrozen, NO, 'copy should not be frozen');
  keys.forEach(function(key) {
    equals(copy.get(key), q.get(key), 'copy.%@ should = original.%@'.fmt(key, key));
  }, this);
  
});
