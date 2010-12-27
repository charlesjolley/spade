# ==========================================================================
# Project:   Ivory
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

module Ivory
  
  class Process
    
    # *args req to make this appear as a func
    def cwd(*args)
      Dir.pwd
    end
    
    def stdout
      $stdout
    end
        
  end
  
end

Spade.exports = Ivory::Process.new(Spade.current_context)
