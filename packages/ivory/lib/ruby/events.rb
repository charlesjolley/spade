# ==========================================================================
# Project:   Ivory
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

require File.expand_path(File.join(__FILE__, '..', 'namespace'))

module Ivory
  class EventEmitterModule

    include Namespace
    
    class EventEmitter
      attr_accessor :_events

      def emit(e, *args)
        return unless @_events
        case notify = @_events[e]
        when V8::Function
          notify.methodcall(self, *args)
        when V8::Array
          notify.each {|listener| listener.methodcall(self, *args) if listener}
        else
          return false
        end
        return true
      end

    end
        
  end

end

Spade.exports = Ivory::EventEmitterModule.new
