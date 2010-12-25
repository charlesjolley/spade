# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

require 'v8'
require 'spade/loader'

TIKIJS_PATH = File.expand_path File.join(File.dirname(__FILE__), '..', 'spade.js')

module Spade
  
  # find the current path with a package.json or .packages or cur_path
  def self.discover_root(cur_path)
    ret = File.expand_path(cur_path)
    while ret != '/' && ret != '.'
      return ret if File.exists?(File.join(ret,'package.json')) || File.exists?(File.join(ret,'.spade'))
      ret = File.dirname ret
    end
    
    return cur_path
  end
  
  class Context < V8::Context

    attr_accessor :rootdir
    
    # Load the spade and racer-loader.
    def initialize(opts={})      
      @rootdir = opts[:rootdir] || opts['rootdir']
      super(opts) do |ctx|
        ctx['ENV'] = (opts[:env] || ENV).to_hash
        ctx['ARGV'] = opts[:argv] || ARGV
        
        ctx.load(TIKIJS_PATH)
        ctx['rubyLoader'] = Loader.new(self)
        ctx.eval 'spade.loader = rubyLoader;'
        ctx.eval 'require = function(id) { return spade.require(id); };'
        ctx.eval 'require.async = function(id, done) { return spade.async(id, done); }; '
        
        yield(ctx) if block_given?
      end
    end
    
  end
end

      
      
  
