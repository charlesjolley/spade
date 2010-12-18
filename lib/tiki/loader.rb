# ==========================================================================
# Project:   Tiki - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

require 'json'


module Tiki

  def self.current_context
    @current_context
  end
  
  def self.current_context=(ctx)
    @current_context = ctx
  end
  
  class Loader
    
    def initialize(ctx)
      @ctx = ctx
    end
    
    # exposed to JS.  Find the JS file on disk and register the module
    def loadFactory(tiki, id, done=nil)
      parts = id.split '/'
      package_name = parts.shift
      package_info = packages[package_name]
      
      return nil if package_info.nil?

      if parts.size>0 && parts[0].chars.first == '~'
        dirname = parts.shift[1..-1]
        if package_info[:directories][dirname]
          dirname = package_info[:directories][dirname]
        else
          dirname = [dirname]
        end
      else
        dirname = package_info[:directories]['lib']
        dirname = ['lib'] if dirname.nil?
      end
      
      filename = parts.pop
      dirname.each do |dir|
        js_path = File.join(package_info[:path], dir, parts, filename+'.js')
        rb_path = File.join(package_info[:path], dir, parts, filename+'.rb')
        if File.exist? js_path
          load_module id, js_path
          return nil
          
        elsif File.exists? rb_path
          load_ruby id, rb_path
          return nil
        end
        
      end
      
      return nil
    end
    
    def load_module(id, module_path)
      module_contents = File.read(module_path).to_json # encode as string
      @ctx.eval("tiki.register('#{id}',#{module_contents});")
      nil
    end
    
    def load_ruby(id, rb_path)
      old_context = Tiki.current_context 
      Tiki.current_context = @ctx
      require rb_path
      Tiki.current_context = old_context
      
      @ctx.eval("tiki.register('#{id}', '');")
    end
    
    def packages
      @packages unless @packages.nil?
      @packages = {}

      # add global packages in tiki project
      globals = File.expand_path(File.join(__FILE__, '..', '..', '..', 'packages'))
      package_paths = Dir.glob File.join(globals,'*')
      package_paths.each { |path| add_package(path) }      
      
      # in reverse order of precedence
      %w[.packages/cache vendor/cache vendor/packages packages].each do |p|
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
      
      directories = json["directories"] || { "lib" => ["lib"] }
      @packages[json["name"]] = { :path => path, :directories => directories }
    end
    
  end
  
  
end
