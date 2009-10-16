// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals CoreTest */

"import utils";
"export package CoreTest";

/** @namespace

  CoreTest is the unit testing library for SproutCore.  It includes a test 
  runner based on QUnit with some useful extensions for testing SproutCore-
  based applications.
  
  You can use CoreTest just like you would use QUnit in your tests directory.
*/
CoreTest = {
  
  /**
    If set to false, then built-in assertions will simply record errors to the
    current logger instead of throwing an error, stopping the unit test.
    
    @property {Boolean}
  */
  throwsOnFailure: true,
  
  /**
    Set to a logger object during a test run.
    
    @property {Logger}
  */
  logger: null,
  
  // ..........................................................
  // SUPPORT METHODS
  // 
  
  /**
    Returns a stub function that records any passed arguments and a call
    count.  You can pass no parameters, a single function or a hash.  
    
    If you pass no parameters, then this simply returns a function that does 
    nothing but record being called.  
    
    If you pass a function, then the function will execute when the method is
    called, allowing you to stub in some fake behavior.
    
    If you pass a hash, you can supply any properties you want attached to the
    stub function.  The two most useful are "action", which is the function 
    that will execute when the stub runs (as if you just passed a function), 
    and "expect" which should evaluate the stub results.
    
    In your unit test you can verify the stub by calling stub.expect(X), 
    where X is the number of times you expect the function to be called.  If
    you implement your own test function, you can actually pass whatever you
    want.
    
    Calling stub.reset() will reset the record on the stub for further 
    testing.

    @param {String} name the name of the stub to use for logging
    @param {Function|Hash} func the function or hash
    @returns {Function} stub function
  */
  stub: function(name, func) {  

    // normalize param
    var attrs = {};
    if (typeof func === "function") {
      attrs.action = func;
    } else if (typeof func === "object") {
      attrs = func ;
    }

    // create basic stub
    var ret = function() {
      ret.callCount++;
      
      // get arguments into independent array and save in history
      var args = [], loc = arguments.length;
      while(--loc >= 0) args[loc] = arguments[loc];
      args.unshift(this); // save context
      ret.history.push(args);
      
      return ret.action.apply(this, arguments);
    };
    ret.callCount = 0 ;
    ret.history = [];
    ret.stubName = name ;

    // copy attrs
    var key;
    for(key in attrs) {
      if (!attrs.hasOwnProperty(key)) continue ;
      ret[key] = attrs[key];
    }

    // add on defaults
    if (!ret.reset) {
      ret.reset = function() {
        this.callCount = 0;
        this.history = [];
      };
    }
    
    if (!ret.action) {
      ret.action = function() { return this; };
    }
    
    if (!ret.expect) {
      ret.expect = function(callCount) {
        if (callCount === YES) {
          ok(this.callCount > 0, CoreTest.fmt("%@ should be called at least once", this.stubName));
        } else {
          if (callCount === NO) callCount = 0;
          equals(this.callCount, callCount, CoreTest.fmt("%@ should be called X times", this.stubName));
        }
      };
    }
    
    return ret ;
  },
  

  /** Test is OK */
  OK: 'passed',
  
  /** Test failed */
  FAIL: 'failed',
  
  /** Test raised exception */
  ERROR: 'errors',
  
  /** Test raised warning */
  WARN: 'warnings',
  
  showUI : false
  
};
