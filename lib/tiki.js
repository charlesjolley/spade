// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*jslint evil:true */
/*globals ARGS ARGV ENV */

"use modules false";
"use loader false";

/*! @license
==========================================================================
Tiki 2.0 CommonJS Runtime
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

Tiki is part of the SproutCore project.

SproutCore and the SproutCore logo are trademarks of Sprout Systems, Inc.

For more information visit http://www.sproutcore.com/tiki

==========================================================================
@license */

// Make this work when loaded from browser or from node.js
var tiki ;
(function() {
  
  var Tiki, Tp, CircularRequireError, NotFoundError, Sandbox, Sp, 
      Loader, Lp, K;
  
  // defining these types here will allow the minifier the compact them
  if ('undefined' !== typeof tiki) return ; // nothing to do
  
  K = function() {}; // noop
  
  
  function packageFor(id) {
    if (!id) return null;
    var idx = id.indexOf(':');
    return idx>=0 ? id.slice(0,idx) : null;
  }
  
  function moduleFor(id) {
    if (!id) return null;
    var idx = id.indexOf(':');
    return idx>=0 ? id.slice(idx+1, id.length) : id;
  }
  
  function remap(packageId, moduleId, contextPkg) {
    var mappings = contextPkg ? contextPkg.mappings : null;
    if (mappings && mappings[packageId]) packageId = mappings[packageId];
    return packageId+':'+moduleId;
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
  
  Sandbox = function(tiki) {
    this.tiki = tiki; 
    this._modules = {}; // cached export results
    this._used = {}; // to detect circular references
  };
  
  Sp = Sandbox.prototype;
  
  /**
    Sandbox-specific require.  This is actually the most primitive form of
    require.
  */
  Sp.require = function(id, callingId, callingPkg) {
    id = this.tiki.normalize(id, callingId, callingPkg);

    var ret = this._modules[id];
    if (ret) ret = ret.exports;
    
    if (ret) {
      if (!this._used[id]) this._used[id] = ret;
      return ret ;

    } else {
      var factory = this.tiki.loadFactory(id);
      if (!factory) throw new NotFoundError(id);
      ret = execFactory(id, factory, this, this.tiki.packageFor(id));
      
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
    id = this.tiki.normalize(id, callingId, callingPkg);
    return this.tiki.async(id, callback);
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
  
  Lp.loadFactory = function(tiki, id, done) {
    
    // loader only works for async requests and only in browser
    if (!done) return this;
    if ('undefined'===typeof document) {
      done(new Error("Cannot load package "+id+" outside of browser"));
      return this;
    }
    
    var packageId, that = this, extern = tiki.packageFor(id);

    // not actually loadable
    if (!extern || !extern.extern) {
      done(new NotFoundError(id));
      
    } else {

      // now do actual load of src
      if (!extern.src) {
        throw new Error("Cannot load package "+id+" without a src URL");
      }
      
      // if already loading, just add to queue
      packageId = packageFor(id);
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
  
  // ..........................................................
  // Tiki Class - defined so we can recreate 
  // 
  
  Tiki = function() {
    this.sandbox = new this.Sandbox(this);
    this._factories = {}; 
    this._packages  = { tiki: { "name": "tiki" } }; // register self to avoid reloads
  };
  
  Tp = Tiki.prototype;
  
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
    if (id.indexOf(':')>=0) id = packageFor(this.normalize(id)) ;
    return this._packages[id];
  };
  
  /**
    Normalize a moduleId, expanding it if needed.
  */
  Tp.normalize = function(id, contextId, contextPkg) {

    // note: if id has a packageId, ignore the contextId
    var packageId = packageFor(id);
    if (packageId) contextId = null;

    // if you just name a package, assume it is the index module
    if (!packageId && this._packages[id]) {
      packageId = id ;
      id = 'index';
    } else {
      packageId = packageId || packageFor(contextId) || '(default)';
      id = moduleFor(id);
    }

    
    // some special cases...
    if (id.indexOf('.')<0) {
      if (id[0]==='/') id = id.slice(1);
      if (id[id.length-1]==='/') id = id.slice(0,-1);
      return remap(packageId, id, contextPkg); // nothing to do
    }

    contextId = moduleFor(contextId);
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
    
    return remap(packageId, parts.join('/'), contextPkg);
  };
  
  // instantiate tiki and also attach class for testing
  tiki = new Tiki();
  tiki.loader = new Loader(); // use default loader
  
  tiki.Tiki = Tiki;
  tiki.Sandbox = Sandbox;
  tiki.Loader  = Loader;
  tiki.CircularRequireError = CircularRequireError;
  tiki.NotFoundError = NotFoundError;
  
  if ('undefined'!==typeof ENV) tiki.ENV = ENV;
  if ('undefined'!==typeof ARGV) tiki.ARGS = ARGV;
  if ('undefined'!==typeof ARGS) tiki.ARGS = ARGS;
  
  // make this work when called as a module
  if (('undefined' !== typeof require)&&('undefined' !== typeof module)) {
    module.exports = tiki;
  }

})();

