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
    def loadFactory(spade, id, formats, done=nil)
      
      # load individual files
      if id =~ /^file:\//
        js_path = id[5..-1]
        if File.exists? js_path
          load_module id, js_path, ['js'], js_path
        end
        return nil
      end

      
      parts = id.split '/'
      package_name = parts.shift
      package_info = packages[package_name]
      skip_module  = false
      
      return nil if package_info.nil?

      if parts.size==1 && parts[0] == '~package'
        skip_module = true
      
      else
        dirname = extract_dirname(parts, package_info)
      end
      
      # register the package first - also make sure dependencies are 
      # registered since they are needed for loading plugins
      unless package_info[:registered]
        package_info[:registered] = true
        @ctx.eval "spade.register('#{package_name}', #{package_info[:json].to_json});"
        
        deps = package_info[:json]['dependencies'];
        (deps||[]).each do |dep_name, ignored|
          dep_package_info = packages[dep_name]
          next unless dep_package_info && !dep_package_info[:registered]
          dep_package_info[:registered] = true
          @ctx.eval "spade.register('#{dep_name}', #{dep_package_info[:json].to_json});"
        end
              
      end
      
      unless skip_module
        filename = parts.pop
        base_path = package_info[:path]
        formats = ['js'] if formats.nil?
        formats.each do |fmt|
          cur_path = File.join(base_path, dirname, parts, filename+'.'+fmt)
          if File.exist? cur_path
            load_module id, cur_path, fmt, cur_path
            return nil
          end
        end
        
        rb_path = File.join(package_info[:path],dirname,parts, filename+'.rb')
        if File.exists? rb_path
          load_ruby id, rb_path
          return nil
        end
        
      end
      
      return nil
    end

    # exposed to JS.  Determines if the named id exists in the system
    def exists(spade, id, formats)
      
      # individual files
      return File.exists?(id[5..-1]) if id =~ /^file:\//

      parts = id.split '/'
      package_name = parts.shift
      package_info = packages[package_name]
      
      return false if package_info.nil?
      return true if parts.size==1 && parts[0] == '~package'
      
      dirname = extract_dirname(parts, package_info)
      
      
      filename = parts.pop
      base_path = package_info[:path]
      formats = ['js'] if formats.nil?
      formats.each do |fmt|
        cur_path = File.join(base_path, dirname, parts, filename+'.'+fmt)
        return true if File.exist? cur_path
      end
      
      rb_path = File.join(package_info[:path],dirname,parts, filename+'.rb')
      return File.exists? rb_path
    end
    
    def load_module(id, module_path, format, path)
      module_contents = File.read(module_path).to_json # encode as string
      @ctx.eval("spade.register('#{id}',#{module_contents}, { format: #{format.to_s.to_json}, filename: #{path.to_s.to_json} });")
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

    def extract_dirname(parts, package_info)
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
      
      dirname
    end

    def add_package(path)
      json_package = File.join(path, 'package.json')
      return unless File.exists?(json_package)

      json = JSON.load(File.read(json_package)) rescue nil
      return if json.nil?

      directories = json["directories"] || { "lib" => "lib" }
      json["root"] = "file:/"+File.split(path).join('/')
      @packages[json["name"]] = { 
        :registered => false,
        :path => path, 
        :directories => directories,
        :json => json 
      }
      
    end
    
  end
  
  
end
