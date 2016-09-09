var gulp = require('gulp');
var babel = require('gulp-babel');
var debug = require('gulp-debug');
var cache = require('gulp-cached');
var replace = require('gulp-replace-task');
var electron = require('electron-connect').server.create();
var async = require('async');
var tcpPortUsed = require('tcp-port-used');
var CONFIG = require('./src/config');

var replaceOptions = {
  patterns: [
    {
      match: 'PORT',
      replace: CONFIG.PORT
    }
  ]
};

var isPortUsed = function (port, callback) {
  tcpPortUsed
    .check(port, '127.0.0.1')
    .then(function (inUse) {
      callback(null, inUse);
    }, function (err) {
      callback(err);
  });
};

gulp.task('check-port', function (callback) {
  isPortUsed(CONFIG.PORT, function (err, portInUse) {
    if (err)
      return callback('An unknown error occured');
    if (portInUse)
      return callback('The port ' + CONFIG.PORT + ' is already in use');
  
    callback();
  });
});

gulp.task('electron:start', ['transpile', 'copy'], () => electron.start());

gulp.task('watch', function () {
  gulp.watch(['src/**/*.js', '!src/client/*'], ['transpile', electron.restart]);

  gulp.watch(['src/client/**/*.{html,css}'], ['copy', electron.reload]);
  gulp.watch(['src/client/**/*.js'], ['transpile', electron.reload]);
});

gulp.task('transpile', function (callback) {
  gulp.src(['src/**/*.js'])
    .pipe(cache('transpile'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('dist'))
    .on('end', callback);
});

gulp.task('copy', function (callback) {
  gulp.src(['src/**/*.*', '!src/**/*.js'])
    .pipe(cache('copy'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(gulp.dest('dist'))
    .on('end', callback);
});

gulp.task('default', ['transpile', 'copy', 'check-port', 'electron:start', 'watch']);
