
module Ivory
  
  class Process
    
    def initialize(ctx)
      @ctx = ctx
    end
    
    def binding(name)
      @ctx.eval("spade.require('ivory/ruby/#{name}');")
    end
    
    def stdout
      $stdout
    end
    
    # wd=nil req to make this appear as a func
    def cwd(wd=nil)
      Dir.pwd
    end
    
    def exit(status)
      Kernel.exit status
    end
    
    # TODO: Make this a real event emitter at some point?
    def EventEmitter
      @event_emitter ||= @ctx.eval('(function(){})')
    end
    
  end
  
end

Spade.exports = Ivory::Process.new(Spade.current_context)
