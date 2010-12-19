# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================


# Borrowed from RubyRacer
module Spade
  
  class Shell
    def to_s
      "[object Shell]"
    end

    def print(string)
      puts string
    end

    def exit(status = 0)
      Kernel.exit(status)
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
