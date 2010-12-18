// ==========================================================================
// Project:   Spade - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*jslint evil:true */
/*globals ARGS ARGV ENV */

"use modules false";
"use loader false";

/*! @license
==========================================================================
Spade 2.0 CommonJS Runtime
copyright 2010 Strobe Inc.

Permission is hereby granted, free of charge, to any person obtaining a 
copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.

Spade is part of the SproutCore project.

SproutCore and the SproutCore logo are trademarks of Sprout Systems, Inc.

For more information visit http://www.sproutcore.com/spade

==========================================================================
@license */

// Make this work when loaded from browser or from node.js
var spade ;
(function() {
  
  var Spade, Tp, CircularRequireError, NotFoundError, Sandbox, Sp, 
      Loader, Lp, K;
  
  // defining these types here will allow the minifier the compact them
  if ('undefined' !== typeof spade) return ; // nothing to do
  
  K = function() {}; // noop

  // assume id is already normalized
  function packageIdFor(normalizedId) {
    return normalizedId.slice(0, normalizedId.indexOf('/'));
  }
  
  function remap(id, contextPkg) {
    var mappings = contextPkg ? contextPkg.mappings : null;
    if (!mappings) return id;
    
    var packageId = packageIdFor(id);
    if (mappings[packageId]) {
      id = mappings[packageId] + id.slice(id.indexOf('/'));
    }
    return id;
  }
  
  // ..........................................................
  // Errors 
  // 
  
  CircularRequireError = function(id) {
    this.message = 'Circular require detected for module '+id;
  };
  CircularRequireError.prototype = new Error();
  
  NotFoundError = function(id) {
    this.message = 'Module '+id+' not found';
  };
  NotFoundError.prototype = new Error();
  
  // ..........................................................
  // Sandbox - you could make a secure version if you want...
  // 
  
  // runs a factory within context and returns exports...
  function execFactory(id, factory, sandbox, pkg) {
    var require, module;
    
    require = function(moduleId) {
      return sandbox.require(moduleId, id, pkg);
    };
    
    require.async = function(moduleId, callback) {
      return sandbox.async(moduleId, callback, id, pkg);
    };
    
    sandbox._modules[id] = module = { id: id, exports: {}, 'package': pkg };
    
    factory(require, module, module.exports);
    return module.exports;
  }
  
  Sandbox = function(spade) {
    this.spade = spade; 
    this._modules = {}; // cached export results
    this._used = {}; // to detect circular references
  };
  
  // alias this to help minifier make the page a big smaller.
  Sp = Sandbox.prototype;
  
  /**
    Sandbox-specific require.  This is actually the most primitive form of
    require.
  */
  Sp.require = function(id, callingId, callingPkg) {
    id = this.spade.normalize(id, callingId, callingPkg);

    var ret = this._modules[id];
    if (ret) ret = ret.exports;
    
    if (ret) {
      if (!this._used[id]) this._used[id] = ret;
      return ret ;

    } else {
      var factory = this.spade.loadFactory(id);
      if (!factory) throw new NotFoundError(id);
      ret = execFactory(id, factory, this, this.spade.packageFor(id));
      
      // detect circular references...
      if (this._used[id] && (this._used[id] !== ret)) {
        throw new CircularRequireError(id);
      }
    }
    
    return ret ;
  };

  /**
    Sandbox-specific async load.  This is actually the most primitive form of
    require.
  */
  Sp.async = function(id, callback, callingId, callingPkg) {
    id = this.spade.normalize(id, callingId, callingPkg);
    return this.spade.async(id, callback);
  };
  
  // ..........................................................
  // LOADER
  // 
  
  /**
    The built-in loader object knows how to load whole packages as long as
    you have registered an external reference to the package.  This is pkg
    info that contains:
    
        {
          extern: true,  // this is not a real package yet
          src: 'http://example.com/bar',  // URL to load
          expects: ['foo', 'bar', 'baz']  // optional modules to expect
        }
  */
  Loader = function() {
    this._loading = {};
  };
  
  Lp = Loader.prototype;
  
  Lp.loadFactory = function(spade, id, done) {
    
    // loader only works for async requests and only in browser
    if (!done) return this;
    if ('undefined'===typeof document) {
      done(new Error("Cannot load package "+id+" outside of browser"));
      return this;
    }
    
    var packageId, that = this, extern = spade.packageFor(id);

    // not actually loadable
    if (!extern || !extern.extern) {
      done(new NotFoundError(id));
      
    } else {

      // now do actual load of src
      if (!extern.src) {
        throw new Error("Cannot load package "+id+" without a src URL");
      }
      
      // if already loading, just add to queue
      packageId = packageIdFor(spade.normalize(id));
      if (this._loading[packageId]) {
        this._loading[packageId].push(done);
      } else {
        this._loading[packageId] = [done];
        this.loadURL(extern.src, function() { that.didLoad(packageId); });
        // TODO: Load dependencies
      }
    } 
    return this;
  };
  
  Lp.didLoad = function(packageId) {
    // TODO: verify/load dependencies
    var callbacks = this._loading[packageId];
    delete this._loading[packageId];
    if (callbacks) callbacks.forEach(function(done) { done(); });
  };
  
  // actually create a script tag and load it
  Lp.loadURL = function(url, callback) {
    var el, head;
    
    el = document.createElement('script');
    el.src = url;
    el.type = 'text/javascript';
    el.onload = callback;

    head = document.head || document.body;
    head.appendChild(el);
    head = el = null;
  };

  // NOTE: On ready stuff mostly stolen from jQuery 1.4.  Need to incl here
  // because spade will often be used to load jQuery.
  // Will only be invoked once.  Just be prepared to call it
  Lp.scheduleReady = function(callback) {

    // handle case where ready is invoked AFTER the document is already ready
    if ( document.readyState === "complete" ) return setTimeout(callback, 1);

    var handler, handled = false;
    
    // The DOM ready check for Internet Explorer
    function doScrollCheck() {
      if (handled) return;

      try {
        // If IE is used, use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        document.documentElement.doScroll("left");
      } catch(e) {
        setTimeout( doScrollCheck, 1 );
        return;
      }

      // and execute any waiting functions
      handler();
    }


    // Mozilla, Opera and webkit nightlies currently support this event
    if (document.addEventListener) {
      
      handler = function() {
        if (handled) return;
        handled = true;
        document.removeEventListener("DOMContentLoaded", handler, false);
        window.removeEventListener('load', handler, false);
        callback();
      };
      
      document.addEventListener( "DOMContentLoaded", handler, false);
      
      // A fallback to window.onload, that will always work
      window.addEventListener( "load", handler, false );

    // If IE event model is used
    } else if ( document.attachEvent ) {
      
      handler = function() {
        if (!handled && document.readyState === "complete") {
          handled = true;
          document.detachEvent( "onreadystatechange", handler );
          window.detachEvent('onload', handler);
          callback();
        }
      };

      // ensure firing before onload,
      // maybe late but safe also for iframes
      document.attachEvent("onreadystatechange", handler);
      
      // A fallback to window.onload, that will always work
      window.attachEvent( "onload", handler);

      // If IE and not a frame
      // continually check to see if the document is ready
      var toplevel = false;

      try {
        toplevel = window.frameElement === null;
      } catch(e) {}
      if ( document.documentElement.doScroll && toplevel ) doScrollCheck();
    }
  };
  
  // ..........................................................
  // Spade Class - defined so we can recreate 
  // 
  
  Spade = function() {
    this.sandbox = new this.Sandbox(this);
    this._factories = {}; 
    this._packages  = { spade: { "name": "spade" } }; // register self to avoid reloads
  };
  
  Tp = Spade.prototype;
  
  Tp.Sandbox = Sandbox;
  
  /**
    Register a module or package information.  You can pass one of the
    following:
    
      'moduleId', 'module body string'
      'moduleId', function() { module func }
      'moduleId' - just register module id and no body to indicate presence
    
    @param {String} id
      The module or package id
    
    @param {String|Function|Hash} data
      The module or package data
  */
  Tp.register = function(id, data) {
    if (!data) data = K ; 
    var t = typeof data, isExtern;
    
    // module
    if (t==='string' || t==='function') {
      id = this.normalize(id);
      this._factories[id] = data;
      
    // package
    } else {
      this._packages[id] = data;
    }

    return this;
  };

  /**
    Efficient way to register external packages.  Pass a hash of packageIds 
    and source URLs.  If the package is already registered, the extern will
    not replace it so this is safe to call multiple times.
  */
  Tp.externs = function(externs) {
    var extern, packages = this._packages;
    for(var packageId in externs) {
      if (!externs.hasOwnProperty(packageId)) continue;
      if (packages[packageId] && !packages[packageId].extern) continue;

      extern = externs[packageId];
      if ('string' === typeof extern) extern = {name: packageId, src: extern};
      extern.extern = true;
      this.register(packageId, extern);
    }
  };
  
  /**
    Require a module from the default sandbox.
    
    @param {String} id
      The module id.
      
    @returns {Hash} module exports 
  */
  Tp.require = function(id) {
    return this.sandbox.require(id);
  };

  
  /**
    Async load a module if it is not already a registered factory.  Invoke
    the passed callback with an optional error object when the module is
    ready to load.
  */
  Tp.async = function(id, callback) {
    id = this.normalize(id);
    if (!this._factories[id]) {
      if (this.loader && this.loader.loadFactory) {
        this.loader.loadFactory(this, id, callback); // async load
      } else callback(new NotFoundError(id)); // no loader to find...
    } else callback(); // already loaded
  };
  
  /**
    Called by the sandbox to get a factory function for the named moduleId
  */
  Tp.loadFactory = function(id) {
    
    var ret = this._factories[id];
    if (!ret && this.loader && this.loader.loadFactory) {
      this.loader.loadFactory(this, id);
      ret = this._factories[id];
    }
    
    if ('string' === typeof ret) {
      ret = eval('(function(require, module, exports) {\n'+ret+';\n}) //@ sourceURL='+id+'\n');
      this._factories[id] = ret ; // make into a function on demand
    }
    return ret ;
  };
  
  
  /**
    Returns the package info, if any, for the named module or packageId
  */
  Tp.packageFor = function(id) {
    return this._packages[packageIdFor(this.normalize(id))];
  };
  
  /**
    Normalize a moduleId, expanding it if needed.
  */
  Tp.normalize = function(id, contextId, contextPkg) {
    
    // slice separator off the end since it is not used...
    if (id[id.length-1]==='/') id = id.slice(0,-1);

    // need to walk if there is a .
    if (id.indexOf('.')>=0) {
      var parts = contextId && (id[0]==='.') ? contextId.split('/') : [],
          idx = 0, 
          len = id.length,
          part, next;

      parts.pop(); // get rid of the last path element since it is a module.
      while(idx<len) {
        next = id.indexOf('/', idx);
        if (next<0) next = len;
        part = id.slice(idx, next);
        if (part==='..') parts.pop();
        else if (part!=='.' && part!=='' && part!==null) parts.push(part);
        // skip .., empty, and null.
        idx = next+1;
      }
      
      id = parts.join('/');
      
    // else, just slice off beginning '/' if needed
    } else if (id[0]==='/') id = id.slice(1);
    
    // if we end up with no separators, make this a pkg
    if (id.indexOf('/')<0) id = id+'/main';
    // may need to walk if there is a separator...
    if (id.indexOf('/')>0 || id.indexOf('.')>0) {
    }
    // slice separators off begin and end
    if (id[0]==='/') id = id.slice(1);

    return remap(id, contextPkg);
  };

  // uses the loader to invoke when the app is ready.  For the browser this 
  // is on the ready event.
  Tp.ready = function(callback) {
    switch(this.readyState) {
      case 'ready':
        callback();
        break;
      
      case 'scheduled':
        this._readyQueue.push(callback);
        break;
        
      default:
        this._readyQueue = [callback];
        this.readyState = 'scheduled';
        if (this.loader && this.loader.scheduleReady) {
          var that = this;
          this.loader.scheduleReady(function() {
            var queue = that._readyQueue, len = queue ? queue.length : 0;
            that._readyQueue = null;
            that.readyState = 'ready';
            for(var idx=0;idx<len;idx++) queue[idx]();
          });
          
        } else {
          throw new Error('Loader does not support activate on ready state');
        }
    }
  };
  
  // instantiate spade and also attach class for testing
  spade = new Spade();
  spade.loader = new Loader(); // use default loader
  
  spade.Spade = Spade;
  spade.Sandbox = Sandbox;
  spade.Loader  = Loader;
  spade.CircularRequireError = CircularRequireError;
  spade.NotFoundError = NotFoundError;
  
  if ('undefined'!==typeof ENV) spade.ENV = ENV;
  if ('undefined'!==typeof ARGV) spade.ARGS = ARGV;
  if ('undefined'!==typeof ARGS) spade.ARGS = ARGS;
  
  // make this work when called as a module
  if (('undefined' !== typeof require)&&('undefined' !== typeof module)) {
    module.exports = spade;
  }

})();

