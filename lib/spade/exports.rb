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
    
    include Namespace
    
    attr_reader :context
    
    def initialize(ctx)
      @context = ctx
    end
    
  end
  
end

