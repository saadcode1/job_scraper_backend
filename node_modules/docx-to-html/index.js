'use strict'
var mammoth = require('mammoth');
const through2 = require('through2');
const replaceExt = require('replace-ext');

module.exports = () => {
  return through2.obj((file, enc, cb) => {
    if (file.isNull()) return cb(null, file);
    if (file.isStream()) return cb(new PluginError('[docx-html-converter]: ', 'Stream is not supported'));
      mammoth.convertToHtml({path: file.path})
        .then(function(result){
            var rawOutput = result.value;
            var bufferedOutput = new Buffer(rawOutput);
            file.contents = bufferedOutput;
            file.path = replaceExt(file.path, '.html');
            cb(null, file);
      }).done();
  });
};