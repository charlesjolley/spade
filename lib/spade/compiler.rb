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
        sandbox['ctx'] = Context.new :process => @ctx.process
      end
    end
    
    def compile(sandbox, data, filename)
      ctx = sandbox['ctx'] || @ctx
      ctx.eval("(#{data})", filename)
    end
    
    def teardown(sandbox)
      sandbox['ctx'] = nil
    end
    
  end
  
end
