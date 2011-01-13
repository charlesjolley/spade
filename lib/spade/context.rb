# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

require 'v8'
require 'spade/loader'
require 'spade/compiler'
require 'spade/console'
require 'spade/reactor'

TIKIJS_PATH = File.expand_path File.join(File.dirname(__FILE__), '..', 'spade.js')

module Spade
  
  # Creates a basic context suitable for running modules.  The environments
  # setup in this context will mimic a browser worker thread context, 
  # including timeouts and a console.  A navigator object is also defined 
  # that provides some general information about the context.
  class Context < V8::Context

    attr_reader :reactor 
    
    def require(mod_name)
      self.eval("require('#{mod_name}');");
    end
    
    # Load the spade and racer-loader.
    def initialize(opts={})      
      @reactor = opts[:reactor]
      super(opts) do |ctx|
        ctx['reactor'] = @reactor
        ctx['console'] = Console.new
        ctx['window']  = ctx.scope
        ctx.eval %[
          (function() {
            var r = reactor;
            setTimeout    = function(c,i) { return r.set_timeout(c,i); };
            setInterval   = function(c,i) { return r.set_interval(c,i); };
            clearTimeout  = function(t) { return r.clear_timeout(t); };
            clearInterval = function(t) { return r.clear_interval(t); };
            navigator     = {
              appName: 'spade',
              appVersion: "#{Spade::VERSION}",
              platform: "#{RUBY_PLATFORM}",
              userAgent: 'spade #{Spade::VERSION}; #{RUBY_PLATFORM}'
            }
            
            exit = function(status) { return r.exit(status || 0); };
          })();
        ]

        ctx['reactor'] = nil 
        
        yield(ctx) if block_given?
      end
    end

  end
  
  # The primary context created when running spade exec or spade console.
  # This context will also automatically start a reactor loop.
  class MainContext < Context

    attr_accessor :rootdir
    
    # Load the spade and racer-loader.
    def initialize(opts={})      
      env = opts[:env] || ENV
      @rootdir = opts[:rootdir] || opts['rootdir']
      @reactor = opts[:reactor] ||= Reactor.new(self)
      lang = opts[:language] ||= (env['LANG']||'en_US').gsub(/\..*/, '')
      lang = lang.gsub '_', '-'
      

      super(opts) do |ctx|
        ctx['ENV'] = env.to_hash
        ctx['ENV']['SPADE_PLATFORM'] = { 'ENGINE'   => 'spade' }
        ctx['ENV']['LANG'] = lang
         
        ctx['ARGV'] = opts[:argv] || ARGV
        
        # Load spade and patch in compiler and loader plugins
        ctx.load(TIKIJS_PATH)
        ctx['rubyLoader'] = Loader.new(self)
        ctx['rubyCompiler'] = Compiler.new(self)
        
        ctx.eval %[
          spade.loader = rubyLoader;
          spade.compiler = rubyCompiler;
          spade.defaultSandbox.rootdir = #{@rootdir.to_json};
          spade.globalize();
        ]

        ctx['rubyLoader'] = ctx['rubyCompiler'] = nil
        
        @reactor.start do
          yield(self) if block_given?
        end
        
      end
    end
    
  end
end

      
      
  
