# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

module Spade

  # Compiler plugin for the default context.  Know how to create a new
  # isolated context for the object
  class Compiler
    
    def initialize(ctx)
      @ctx = ctx
    end
    
    def setup(sandbox)
      if sandbox['isIsolated']
        sandbox['ctx'] = Context.new :reactor => @ctx.reactor
      end
    end
    
    def compile(data, sandbox, filename)
      ctx = sandbox['ctx'] || @ctx
      ctx.eval("(#{data})", filename)
    end
    
    def teardown(sandbox)
      sandbox['ctx'] = nil
    end
    
  end
  
end
