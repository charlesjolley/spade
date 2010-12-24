// ==========================================================================
// Project:   Ivory
// Copyright: ©2010 Strobe Inc. All rights reserved.
// License:   Licened under MIT license
// ==========================================================================

var process = require('./ruby/process');

var SlowBuffer = process.binding('buffer').SlowBuffer;
var Buffer; 

var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}


SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.write = function(string, offset, encoding) {
  // Support both (string, offset, encoding)
  // and the legacy (string, encoding, offset)
  if (!isFinite(offset)) {
    var swap = encoding;
    encoding = offset;
    offset = swap;
  }

  offset = +offset || 0;
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset);

    case 'ascii':
      return this.asciiWrite(string, offset);

    case 'binary':
      return this.binaryWrite(string, offset);

    case 'base64':
      return this.base64Write(string, offset);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

exports.Buffer = exports.SlowBuffer = SlowBuffer;

// Buffer
// 
// Buffer = function Buffer(subject, encoding, offset) {
//   if (!(this instanceof Buffer)) {
//     return new Buffer(subject, encoding, offset);
//   }
// 
//   var type;
// 
//   // Are we slicing?
//   if (typeof offset === 'number') {
//     this.length = encoding;
//     this.parent = subject;
//     this.offset = offset;
//   } else {
//     // Find the length
//     type = typeof subject;
//     switch (type) {
//       case 'number':
//         this.length = subject;
//         break;
// 
//       case 'string':
//         // TODO: Fix
//         this.length = subject.length; //Buffer.byteLength(subject, encoding);
//         break;
// 
//       case 'object': // Assume object is an array
//         this.length = subject.length;
//         break;
// 
//       default:
//         throw new Error('First argument need to be an number,' +
//                         'array or string.');
//     }
// 
//     if (this.length > Buffer.poolSize) {
//       // Big buffer, just alloc one.
//       this.parent = new SlowBuffer(this.length);
//       this.offset = 0;
// 
//     } else {
//       // Small buffer.
//       if (!pool || pool.length - pool.used < this.length) allocPool();
//       this.parent = pool;
//       this.offset = pool.used;
//       pool.used += this.length;
//     }
// 
//     // Assume object is an array
//     if (Array.isArray(subject)) {
//       for (var i = 0; i < this.length; i++) {
//         this.parent[i + this.offset] = subject[i];
//       }
//     } else if (type == 'string') {
//       // We are a string
//       this.length = this.write(subject, 0, encoding);
//     }
//   }
// 
//   //SlowBuffer.makeFastBuffer(this.parent, this, this.offset, this.length);
// };
// 
// exports.SlowBuffer = SlowBuffer;
// exports.Buffer = Buffer;
// 
// Buffer.poolSize = 8 * 1024;
// 
// 
// // Static methods
// Buffer.isBuffer = function isBuffer(b) {
//   return b instanceof Buffer || b instanceof SlowBuffer;
// };
// 
// 
// // Inspect
// Buffer.prototype.inspect = function inspect() {
//   var out = [],
//       len = this.length;
//   for (var i = 0; i < len; i++) {
//     out[i] = toHex(this.parent[i + this.offset]);
//   }
//   return '<Buffer ' + out.join(' ') + '>';
// };
// 
// 
// Buffer.prototype.get = function get(i) {
//   if (i < 0 || i >= this.length) throw new Error('oob');
//   return this.parent[this.offset + i];
// };
// 
// 
// Buffer.prototype.set = function set(i, v) {
//   if (i < 0 || i >= this.length) throw new Error('oob');
//   this.parent[this.offset + i] = v;
//   return v;
// };
// 
// 
// // write(string, offset = 0, encoding = 'utf8')
// Buffer.prototype.write = function(string, offset, encoding) {
//   if (!isFinite(offset)) {
//     var swap = encoding;
//     encoding = offset;
//     offset = swap;
//   }
// 
//   offset = +offset || 0;
//   encoding = String(encoding || 'utf8').toLowerCase();
// 
//   // Make sure we are not going to overflow
//   var maxLength = this.length - offset;
// 
//   var ret;
//   switch (encoding) {
//     case 'utf8':
//     case 'utf-8':
//       ret = this.parent.utf8Write(string, this.offset + offset, maxLength);
//       break;
// 
//     case 'ascii':
//       ret = this.parent.asciiWrite(string, this.offset + offset, maxLength);
//       break;
// 
//     case 'binary':
//       ret = this.parent.binaryWrite(string, this.offset + offset, maxLength);
//       break;
// 
//     case 'base64':
//       // Warning: maxLength not taken into account in base64Write
//       ret = this.parent.base64Write(string, this.offset + offset, maxLength);
//       break;
// 
//     default:
//       throw new Error('Unknown encoding');
//   }
// 
//   Buffer._charsWritten = SlowBuffer._charsWritten;
// 
//   return ret;
// };
// 
// 
// // toString(encoding, start=0, end=buffer.length)
// Buffer.prototype.toString = function(encoding, start, end) {
//   encoding = String(encoding || 'utf8').toLowerCase();
// 
//   if (typeof start == 'undefined' || start < 0) {
//     start = 0;
//   } else if (start > this.length) {
//     start = this.length;
//   }
// 
//   if (typeof end == 'undefined' || end > this.length) {
//     end = this.length;
//   } else if (end < 0) {
//     end = 0;
//   }
// 
//   start = start + this.offset;
//   end = end + this.offset;
// 
//   switch (encoding) {
//     case 'utf8':
//     case 'utf-8':
//       return this.parent.utf8Slice(start, end);
// 
//     case 'ascii':
//       return this.parent.asciiSlice(start, end);
// 
//     case 'binary':
//       return this.parent.binarySlice(start, end);
// 
//     case 'base64':
//       return this.parent.base64Slice(start, end);
// 
//     default:
//       throw new Error('Unknown encoding');
//   }
// };
// 
// 
// // byteLength
// //Buffer.byteLength = SlowBuffer.byteLength;
// 
// 
// // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
// Buffer.prototype.copy = function(target, target_start, start, end) {
//   var source = this;
//   start = start || 0;
//   end = end || this.length;
//   target_start = target_start || 0;
// 
//   if (end < start) throw new Error('sourceEnd < sourceStart');
// 
//   // Copy 0 bytes; we're done
//   if (end === start) return 0;
//   if (target.length === 0 || source.length === 0) return 0;
// 
//   if (target_start < 0 || target_start >= target.length) {
//     throw new Error('targetStart out of bounds');
//   }
// 
//   if (start < 0 || start >= source.length) {
//     throw new Error('sourceStart out of bounds');
//   }
// 
//   if (end < 0 || end > source.length) {
//     throw new Error('sourceEnd out of bounds');
//   }
// 
//   // Are we oob?
//   if (end > this.length) {
//     end = this.length;
//   }
// 
//   if (target.length - target_start < end - start) {
//     end = target.length - target_start + start;
//   }
// 
//   return this.parent.copy(target.parent,
//                           target_start + target.offset,
//                           start + this.offset,
//                           end + this.offset);
// };
// 
// 
// // slice(start, end)
// Buffer.prototype.slice = function(start, end) {
//   if (end === undefined) end = this.length;
//   if (end > this.length) throw new Error('oob');
//   if (start > end) throw new Error('oob');
// 
//   return new Buffer(this.parent, end - start, +start + this.offset);
// };
// 
// 
// // Legacy methods for backwards compatibility.
// 
// Buffer.prototype.utf8Slice = function(start, end) {
//   return this.toString('utf8', start, end);
// };
// 
// Buffer.prototype.binarySlice = function(start, end) {
//   return this.toString('binary', start, end);
// };
// 
// Buffer.prototype.asciiSlice = function(start, end) {
//   return this.toString('ascii', start, end);
// };
// 
// Buffer.prototype.utf8Write = function(string, offset) {
//   return this.write(string, offset, 'utf8');
// };
// 
// Buffer.prototype.binaryWrite = function(string, offset) {
//   return this.write(string, offset, 'binary');
// };
// 
// Buffer.prototype.asciiWrite = function(string, offset) {
//   return this.write(string, offset, 'ascii');
// };
// 
// exports.Buffer = Buffer;
// exports.SlowBuffer = SlowBuffer;

