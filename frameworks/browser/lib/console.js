// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals exports */

/**
  @file

  This module exports a console object, which should support that standard 
  console methods as defined by the browser.  Normally we expect the console
  to be equivalent to a "stdout" in a server environment.  In the browser
  environment, we just export the env.window.console object.
  
  system:logger uses this to emit to the standard console log.
  
*/

exports.console = console;

