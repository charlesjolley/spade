# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

require 'json'


module Spade

  def self.current_context
    @current_context
  end
  
  def self.current_context=(ctx)
    @current_context = ctx
  end
  
  def self.exports=(klass)
    exports(klass, nil)
  end
  
  def self.exports(klass, path = nil)
    path = @current_path if path.nil?
    @exports ||= {}
    @exports[path] = klass
  end
  
  def self.exports_for(path)
    @current_path = path
    require path
    @current_path = nil
    
    @exports ||= {}
    @exports[path]
  end
    
  
  class Loader
    
    def initialize(ctx)
      @ctx = ctx
    end
    
    def discoverRoot(path)
      Spade.discover_root path
    end
    
    def root(path=nil)
      return @ctx.rootdir if path.nil?
      @ctx.rootdir = path 
      @packages = nil
    end
    
    # exposed to JS.  Find the JS file on disk and register the module
    def loadFactory(spade, id, done=nil)
      
      # load individual files
      if id =~ /^\(file\)\//
        js_path = id[6..-1]
        if File.exists? js_path
          load_module id, js_path
        end
        return nil
      end

      
      parts = id.split '/'
      package_name = parts.shift
      package_info = packages[package_name]
      
      return nil if package_info.nil?

      if parts.size>0 && parts[0].chars.first == '~'
        dirname = parts.shift[1..-1]
        if package_info[:directories][dirname]
          dirname = package_info[:directories][dirname]
        else
          dirname = dirname
        end
      else
        dirname = package_info[:directories]['lib']
        dirname = 'lib' if dirname.nil?
      end
      
      # register the package first
      unless package_info[:registered]
        package_info[:registered] = true
        @ctx.eval "spade.register('#{package_name}', #{package_info[:json].to_json});"
      end
      
      filename = parts.pop
      js_path = File.join(package_info[:path], dirname, parts, filename+'.js')
      rb_path = File.join(package_info[:path], dirname, parts, filename+'.rb')
      if File.exist? js_path
        load_module id, js_path
        return nil
        
      elsif File.exists? rb_path
        load_ruby id, rb_path
        return nil
      end
      
      return nil
    end
    
    def load_module(id, module_path)
      module_contents = File.read(module_path).to_json # encode as string
      @ctx.eval("spade.register('#{id}',#{module_contents});")
      nil
    end
    
    def load_ruby(id, rb_path)

      klass = Spade.exports_for rb_path
      exports = klass.nil? ? {} : klass.new(@ctx)
      @ctx['$__rb_exports__'] = exports
      
      @ctx.eval(%[(function() { 
        var exp = $__rb_exports__; 
        spade.register('#{id}', function(r,e,m) { m.exports = exp; }); 
      })();])
      
      @ctx['$__rb_exports__'] = nil
    end
    
    def packages
      @packages unless @packages.nil?
      @packages = {}

      # add global packages in spade project
      # globals = File.expand_path(File.join(__FILE__, '..', '..', '..', 'packages'))
      # package_paths = Dir.glob File.join(globals,'*')
      # package_paths.each { |path| add_package(path) }      
      
      # in reverse order of precedence
      %w[.spade/packages vendor/cache vendor/packages packages].each do |p|
        package_paths = Dir.glob File.join(@ctx.rootdir, p.split('/'), '*')
        package_paths.each { |path| add_package(path) }
      end

      # add self
      add_package @ctx.rootdir

      @packages
    end
    
    private

    def add_package(path)
      json_package = File.join(path, 'package.json')
      return unless File.exists?(json_package)

      json = JSON.load(File.read(json_package)) rescue nil
      return if json.nil?

      directories = json["directories"] || { "lib" => "lib" }
      @packages[json["name"]] = { 
        :registered => false,
        :path => path, 
        :directories => directories,
        :json => json 
      }
      
    end
    
  end
  
  
end
