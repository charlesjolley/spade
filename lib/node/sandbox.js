// ==========================================================================
// Project:   Spade - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*globals process */

var spade = require('../spade'),
    VM    = require('vm');

var OriginalSandbox = spade.Sandbox;
var Sandbox = function() {
  OriginalSandbox.apply(this, arguments);
  this.ctx = VM.createContext({
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: console,
    navigator: {
      appName: 'node',
      appVersion: process.version,
      platform: process.platform,
      userAgent: 'node '+process.version
    }
  });
};

Sandbox.prototype = Object.create(OriginalSandbox.prototype);
Sandbox.prototype.compile = function(code, filename) {
  return VM.runInContext(code, this.ctx, filename || '(unknown)');
};

exports.Sandbox = Sandbox;
