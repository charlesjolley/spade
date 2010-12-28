# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

require 'eventmachine'

module Spade
  
  # The reactor exposes some API 
  class Reactor

    attr_reader :timers, :running, :holds, :stopped
    
    def initialize(ctx)
      @timers = []
      @running = false
      @stopped = false
      @holds   = 0
    end
    
    # Starts the event loop
    def start
      return if @running

      @running = true
      add_hold # release when finish is called
      
      EventMachine.run do
        @running = true
        @timers.each { |t| t.start unless t.running }
        
        yield if block_given?
        
        @stopped = true
        release_hold
      end
      
    end
    
    def exit(status=0)
      stop_loop
      Kernel.exit(status)
    end
    
    def next_tick(&block)
      if @running
        add_hold
        EventMachine.next_tick do
          yield
          release_hold
        end
      else
        add_timer(0) { yield }
      end
    end
    
    ######################################################
    ## Holds
    ##
    ## Prevents the loop from exiting
    
    def add_hold
      @holds = @holds + 1 
    end
    
    def release_hold
      @holds = @holds - 1
      stop_loop if @stopped && @holds <= 0
    end

    def stop_loop
      @running = false
      EventMachine.stop_event_loop
    end
    

    ######################################################
    ## Timers
    ##
    
    def add_timer(interval, periodic = false, &block)
      add_hold
      Timer.new(self).tap do |timer|
        timer.periodic = periodic
        timer.interval = interval
        timer.callback = block
        @timers << timer
        timer.start if @running
      end
    end
    
    def remove_timer(timer)
      'remove_timer'
      release_hold if @timers.delete(timer)
    end
    
    def set_timeout(callback, interval)
      add_timer interval, false do
        callback.methodcall(self)
      end
    end
    
    def set_interval(callback, interval)
      add_timer interval, true do
        callback.methodcall(self)
      end
    end
    
    def clear_timeout(timer)
      timer.cancel
    end
    
    def clear_interval(timer)
      timer.cancel
    end

    class Timer
      
      attr_accessor :periodic, :interval, :callback
      attr_reader :running

      def initialize(reactor)
        @interval = 0
        @periodic = false
        @callback = nil
        @reactor = reactor
        @running = false
      end

      def start
        @running = true
        if @periodic
          @timer = EventMachine.add_periodic_timer(@interval.to_f / 1000) do
            @callback.call
          end
        else
          @timer = EventMachine.add_timer(@interval.to_f / 1000) do
            @callback.call
            @timer = nil
            @reactor.remove_timer(self)
          end
        end
      end

      def cancel
        EventMachine.cancel_timer(@timer) if @timer
        @timer = nil
        @reactor.remove_timer(self)
      end    
    end
    
    
    
  end

end

