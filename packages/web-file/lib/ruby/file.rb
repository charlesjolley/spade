# ==========================================================================
# Project:   File
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

module WebFile
  class FileExports < Spade::Exports
    
    class Blob
      
      def size
        0
      end

      attr_reader :type, :readable, :writable

      def initialize 
        throw self.class.context['Error'].new("Illegal constructor")
      end
      
      def slice(offset, length, contentType=nil)
        offset = size if offset > size
        length = self.size-offset if offset+length > size
        offset += @offset unless @offset.nil?
        self.dup.setup_slice(offset, length, contentType || @type)
      end

      protected 
      
      def dup
        self.class.new
      end
      
      def setup_slice(offset, length, contentType=nil)
        @offset = offset
        @length = length
        @type = contentType unless contentType.nil?
        self
      end
        
    end
    
    class File < Blob
      
      attr_reader :name, :lastModifiedDate      
      
    end
      
  end
  
  class RealFile < FileExports::File
    
    def initialize(path, ctx, read_only=false, offset=nil, length=nil, type=nil)
      @path   = path
      @ctx    = ctx
      @offset = offset.nil? ? 0 : offset
      @length = length
      @type   = type
      @readable = true
      @writable = !read_only
    end
    
    def name
      @name ||= ::File.basename(@path)
    end
    
    def lastModifiedDate
      @ctx['Date'].new(::File.mtime(@path))
    end
    
    def size 
      total_size = ::File.size(@path) - @offset
      @length.nil? || total_size<@length ? total_size : @length
    end
    
    def type
      require 'rack/mime'
      @type ||= Rack::Mime.mime_type(::File.extname(@path))
    end
    
    protected 
    
    def dup
      self.class.new(@path, @ctx, !@writable, @offset, @length, @type)
    end
    
  end
  
end

Spade.exports WebFile::FileExports
