// ========================================================================
// SC.guidFor Tests
// ========================================================================
/*globals module test ok isObj equals expects */

require('core-test/qunit');
require('sproutcore-runtime/core');

module("Console object");

test("The console object should be defined for all browsers and work if supported", function() {
  ok((console!==undefined), "console should not be undefined");
  console.info("Console.info is working");
  console.log("Console.log is working");
  console.warn("Console.warn is working");
  console.error("Console.error is working");
});

