# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

# Global object used for the shell.
module Spade
  
  class Shell
    
    attr_accessor :ctx
    
    def to_s
      "[object Shell]"
    end

    def exit(status=0)
      ctx.reactor.exit(status)
    end
    
    alias_method :quit, :exit
    
    def help(*args)
      <<-HELP
  print(msg)
    print msg to STDOUT    
      
  exit(status = 0)
    exit the shell
    also: quit()
        
  evalrb(source)
    evaluate some ruby source
  HELP
    end
  end
  
end
