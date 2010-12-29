# ==========================================================================
# Project:   File
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

module WebFile
  class FileReaderExports < Spade::Exports

    def initialize(ctx)
      super(ctx)
      context.require('web-file/ruby/file')
    end

    class FileReader
      
      attr_reader :readyState, :result
      
      attr_accessor :onloadstart, :onprogress, :onload, :onerror, :onloadend
      
      def readAsArrayBuffer(blob)
        throw "FileReader.readAsArrayBuffer() not yet implemented"
      end

      def readAsBinaryString(blob)
        throw "FileReader.readAsBinaryString() not yet implemented"
      end

      def readAsText(blob, encoding=nil)
        throw "FileReader.readAsText() not yet implemented"
      end

      def readAsDataURL(blob)
        throw "FileReader.readAsDataURL() not yet implemented"
      end

      def abort(*args)
        throw "FileReader.abort not yet implemented"
      end
    end

    class FileReaderSync
      
      def readAsArrayBuffer(blob)
        throw "FileReaderSync.readAsArrayBuffer() not yet implemented"
      end

      def readAsBinaryString(blob)
        throw "FileReaderSync.readAsBinaryString() not yet implemented"
      end

      def readAsText(blob, encoding=nil)
        throw "FileReaderSync.readAsText() not yet implemented"
      end

      def readAsDataURL(blob)
        throw "FileReaderSync.readAsDataURL() not yet implemented"
      end

      def abort(*args)
        throw "FileReaderSync.abort not yet implemented"
      end
    end
      
  end
end

Spade.exports WebFile::FileReaderExports
