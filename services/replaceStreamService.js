const { Transform } = require('stream');
const { callbackify } = require('util');

class ReplaceStream extends Transform {
  constructor(searchString, replaceString, prefixString) {
    super({decodeStrings: false});
    this.searchString = searchString || '';
    this.re = new RegExp(this.searchString, 'g');
    this.replaceString = replaceString || '';
    this.firstChunk = true;
    this.prefixString = prefixString || '';
    this.tailPiece = '';
  }

  _transform(data, encoding, callback) {
    let currentChunk = data;
    let transformedString = '';
    if (this.firstChunk) {
      if (typeof this.prefixString === 'string') currentChunk = this.prefixString + currentChunk;
      transformedString = currentChunk.replace(this.re, this.replaceString);
      this.firstChunk = false;
      this.tailPiece = transformedString;
    } else {
      transformedString = (this.tailPiece + currentChunk).replace(this.re, this.replaceString);
      this.push(transformedString.substring(0, this.tailPiece.length));
      this.tailPiece = transformedString.substring(this.tailPiece.length, transformedString.length);
    }
    callback();
  }

  _flush(callback) {
    if (this.tailPiece) this.push(this.tailPiece);
    callback();
  }
}

module.exports = ReplaceStream;