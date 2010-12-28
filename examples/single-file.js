/**
  To run this file just type `spade ./single-file.js`.  It should just write
  out to the console.  Note that since this file is not included inside of a
  package, the only packages available are those installed on the system.

  The ivory package is a set of standardized APIs for accessing the filesystem
  
  Usage:  spade ./single-file.js
*/
/*globals $fs */

require('ivory'); // defines $fs and other utils

var data = $fs.STDIN.read(); 
console.log(data);





    
  