// ==========================================================================
// Project:   Spade - CommonJS Runtime
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*jslint evil:true */
/*globals ARGS ARGV ENV __module */

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
      Loader, Lp, K, Compiler, Cp;
  
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
  CircularRequireError.prototype.toString = function() { return this.message; };
  
  NotFoundError = function(id) {
    this.message = 'Module '+id+' not found';
  };
  //NotFoundError.prototype = new Error();
  NotFoundError.prototype.toString = function() { return this.message; };
  
  // ..........................................................
  // Sandbox - you could make a secure version if you want...
  // 
  
  // runs a factory within context and returns exports...
  function execFactory(id, factory, sandbox, spade) {
    var require, mod;
    
    var pkg      = spade.package(id),
        filename = factory.filename,
        ARGS     = sandbox.ARGV,
        ENV      = sandbox.ENV;
        
    require = function(moduleId) {
      return sandbox.require(moduleId, id, pkg);
    };
    
    require.async = function(moduleId, callback) {
      return sandbox.async(moduleId, callback, id, pkg);
    };
    
    require.sandbox = function(name, isolate) {
      return spade.sandbox(name, isolate);
    };
    
    sandbox._modules[id] = mod = { id: id, exports: {}, 'package': pkg, sandbox: sandbox };
    
    factory = factory.data; // extract the raw module body
    
    // compile if needed - use cache so we only do it once per sandbox
    if ('string' === typeof factory) {
      if (sandbox._factories[id]) {
        factory = sandbox._factories[id];
      } else {
        factory = sandbox.compile('(function(require, exports, __module, __filename, ARGS, ENV) {'+factory+';\n}) //@ sourceURL='+filename+'\n', filename);
        sandbox._factories[id] = factory;
      }
    }
    
    factory(require, mod.exports, mod, filename, ARGS, ENV);
    
    return mod.exports;
  }
  
  /**
    @constructor
    
    Sandbox provides an isolated context for loading and running modules.
    You can create new sandboxes anytime you want.  If you pass true for the 
    isolate flag, then the sandbox will be created in a separate context if 
    supported on the platform.  Otherwise it will share globals with the 
    default sandbox context.
    
    Note that isolated sandboxes are not the same as secure sandboxes.  For 
    example in the browser, a isolated sandbox is created using an iframe 
    which still exposes access to the DOM and parent environment.  
    
    Isolated sandboxes are mostly useful for testing and sharing plugin code
    that might want to use different versions of packages.
    
    @param {Spade} spade
      The spade instance
      
    @param {Boolean} isolate
      Set to true if you want to isolate it
      
    @returns {Sandbox} instance
  */
  Sandbox = function(spade, name, isolate) {
    if (typeof name !== 'string') {
      isolate = name;
      name = null;
    }
    
    if (!name) name = '(anonymous)';
    
    this.spade = spade; 
    this.name  = name;
    this.isIsolated = !!isolate;
    this._factories = {}; // compiled factories
    this._modules   = {}; // cached export results
    this._used      = {}; // to detect circular references
  };

  // alias this to help minifier make the page a big smaller.
  Sp = Sandbox.prototype;
  
  Sp.toString = function() {
    return '[Sandbox '+this.name+']';
  };

  /**
    Evaluate the passed string in the Sandbox context, returning the result.
    This is the primitive used to compile string-encoded factories into 
    modules that can execute within a specific context.
  */
  Sp.compile = function(code, filename) {
    if (this.isDestroyed) throw new Error("Sandbox destroyed");
    if (!this._compilerInited) {
      this._compilerInited = true;
      this.spade.compiler.setup(this);
    }
    return this.spade.compiler.compile(this, code, filename);
  };
  
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
      var factory = this.spade.loadFactory(this.spade.resolve(id, this));
      if (!factory) throw new NotFoundError(id);

      var spade = this.spade;
      if (!this.ENV) this.ENV = spade.ENV;
      if (!this.ARGV) this.ARGV = spade.ARGV;
      ret = execFactory(id, factory, this, spade);
      
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
    var spade = this.spade;
    id = spade.resolve(spade.normalize(id, callingId, callingPkg), this);
    return spade.loadFactory(id, callback);
  };
  
  Sp.isDestroyed = false;
  
  Sp.destroy = function() {
    if (!this.isDestroyed) {
      this.isDestroyed = true;
      this.spade.compiler.teardown(this);
    }
    return this;
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

    var packageId, idx, dirname, that = this, extern = spade.package(id);
    
    // loader only works for sync requests if the package info permits sync
    // loading.  In production mode, normally it should not.
    if (!done && (!extern || !extern.sync)) return this; 

    // this loader only works in the browser
    if ('undefined'===typeof document) {
      done(new Error("Cannot load package "+id+" outside of browser"));
      return this;
    }

    if (!done) {
      
      // compose the URL - if a src is provided use that else compute
      var url = extern.src, originalId = id;
      if (!url) {
        url = extern.root;
        id = spade.normalize(id);
        id = id.slice(id.indexOf('/')+1); // slide off pkg

        // get directory
        if (id[0]==='~') {
          idx = id.indexOf('/');
          dirname = idx>=0 ? id.slice(0, idx) : id;
          id = dirname.length>=id.length ? null : id.slice(dirname.length+1);
          dirname = dirname.slice(1); // get rid of ~
        } else dirname = 'lib';
        
        // map to directories
        if (extern.directories && extern.directories[dirname]) {
          dirname = extern.directories[dirname];
        }
        
        // combine elements to form URL
        if (url === '.') url = null;
        if (dirname && dirname !== '.') url = url ? url+'/'+dirname : dirname;
        if (id && id !== '.') url = url ? url+'/'+id : id;
        url = url+'.js?'+Date.now();
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        if (xhr.status === 200) {
          var body = xhr.responseText;
          if (body.slice(0,2) === '#!') body = body.slice(body.indexOf('\n'));
          spade.register(originalId, body);
        } else {
          throw new Error('fetching '+url+' return status '+xhr.status);
        }
      }
      if (extern.src) url = externs
      
      
    // not actually loadable
    } else if (!extern || !extern.extern) {
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
  // Compiler Class
  // 
  
  Compiler = function() {};
  Cp = Compiler.prototype;
  
  Cp.setup = function(sandbox) {
    if (sandbox.isIsolated) throw new Error("Isolated Sandbox not supported");
  };
  
  Cp.compile = function(sandbox, text, filename) {
    return eval(text);
  };
  
  Cp.teardown = function(sandbox) {
    // noop by default
  };
  
  // ..........................................................
  // Spade Class - defined so we can recreate 
  // 
  
  Spade = function() {
    this.loader   = new this.Loader(this);
    this.compiler = new this.Compiler(this);
    this.defaultSandbox  = this.sandbox();
    this._factories = {}; 
    this._packages  = {};
    // register this instance as the result of the spade package.
    var inst = this;
    this.register('spade', { "name": "spade", "version": Spade.VERSION });
    this.register('spade/main', function(r, e, m) { m.exports = inst; });
  };
  
  Spade.VERSION = "0.1.0";
  
  Tp = Spade.prototype;
  
  // expose the classes.  We do it this way so that you can create a new
  // Spade instance and treat it like the spade module
  Tp.Spade    = Spade;
  Tp.Sandbox  = Sandbox;
  Tp.Loader   = Loader;
  Tp.Compiler = Compiler;
  Tp.CircularRequireError = CircularRequireError;
  Tp.NotFoundError = NotFoundError;
  
  /**
    Returns a new sandbox instance attached to the current spade instance.
    Can isolate if preferred.
    
    @param {Boolean} isolate
      true if you want the sandbox to be isolated.  Throws exception if 
      platform cannot isolate.
    
    @returns {Sandbox} sandbox instance
  */
  Tp.sandbox = function(name, isolate) {
    return new this.Sandbox(this, name, isolate);
  };
  
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
      
    @param {String} opts
      Optionally include additional metadata only if you are registering a
      module factory.  Known keys include 'filename' and 'format' (for 
      compilation of DSLs).
      
  */
  Tp.register = function(id, data, opts) {
    if (!data) data = K ; 
    var t = typeof data, isExtern, factory;
    
    // module
    if (t==='string' || t==='function') {
      id = this.normalize(id);
      this._factories[id] = factory = { data: data };
      factory.filename = opts && opts.filename ? opts.filename : id;
      factory.format   = opts && opts.format ? opts.format : 'js';
      
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
    return this.defaultSandbox.require(id);
  };

  
  /**
    Async load a module if it is not already a registered factory.  Invoke
    the passed callback with an optional error object when the module is
    ready to load.
  */
  Tp.async = function(id, callback) {
    return this.defaultSandbox.async(id, callback);
  };
  
  /**
    Called by the sandbox to get a factory object for the named moduleId
  */
  Tp.loadFactory = function(id, callback) {

    var ret = this._factories[id];
    if (callback) {
      if (!ret) {
        if (this.loader && this.loader.loadFactory) {
          this.loader.loadFactory(this, id, callback);
        } else callback(new NotFoundError(id));
      } else callback();
      
    } else if (!ret && this.loader && this.loader.loadFactory) {
      this.loader.loadFactory(this, id);
      ret = this._factories[id];
    }

    return ret ;
  };
  
  /**
    Returns the package info, if any, for the named module or packageId
  */
  Tp.package = function(id) {
    return this._packages[packageIdFor(this.normalize(id))];
  };
  
  Tp.filename = function(id) {
    return this._filenames[this.normalize(id)];
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

  // maps the passed ID to a potentially location specific ID.  This gives 
  // the loader a way to vary the factory function returned for a given id
  // per sandbox
  Tp.resolve = function(id, sandbox) {
    if (sandbox && this.loader && this.loader.resolve) {
      return this.loader.resolve(id, sandbox);
    } else return id;
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
  
  if ('undefined'!==typeof ENV) spade.ENV = ENV;
  if ('undefined'!==typeof ARGV) spade.ARGS = ARGV;
  if ('undefined'!==typeof ARGS) spade.ARGS = ARGS;
  
  // make this work when called as a module
  if ('undefined' !== typeof require) {
    if ('undefined' !== typeof __module) __module.exports = spade;
    else if ('undefined' !== typeof module) module.exports = spade;
  }

})();

