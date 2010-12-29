# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

module Spade

  module Namespace
    
    def [](name)
      begin
        self.class.const_defined?(name) ? self.class.const_get(name) : yield
      rescue NameError => e
        yield
      end
    end

  end
  
  class Exports
    
    attr_reader :context
    
    def initialize(ctx)
      @context = ctx
    end

    def [](name)
      
      begin
        if self.class.const_defined?(name)
          ret = self.class.const_get(name)
          
          # If we are returning a class, create a custom subclass the first 
          # time that also exposes the current context.
          if ret.instance_of? Class
            @klass_cache ||= {}
            unless @klass_cache[name]

              proc1 = proc { @context } 
              @klass_cache[name] = Class.new(ret) do
                
                @context = proc1.call

                def self.context
                  @context
                end
                
              end

            end
            
            @klass_cache[name]
          else
            ret
          end
            
        else
          yield
        end
        
      rescue NameError => e
        yield
      end
    end
    
  end
  
end

