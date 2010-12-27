// ==========================================================================
// Project:   Spade - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*globals process __dirname */

var SPADE = require('./spade'), spade;

// create a custom instance...    
spade = new SPADE.Spade();
spade.Sandbox = require('./node/sandbox').Sandbox;
spade.Loader  = require('./node/loader').Loader;

spade.sandbox = new spade.Sandbox(spade);
spade.loader  = new spade.Loader();

module.exports = spade;

