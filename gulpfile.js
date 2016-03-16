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

var isPortUsed = function (port, cb) {
  tcpPortUsed
    .check(port, '127.0.0.1')
    .then(function (inUse) {
      cb(null, inUse);
    }, function (err) {
      cb(err);
  });
};

gulp.task('check-port', function (cb) {
  isPortUsed(CONFIG.PORT, function (err, portInUse) {
    if (err) {
      return cb('An unknown error occured');
    }
    if (portInUse)
      return cb('The port ' + CONFIG.PORT + ' is already in use');
  
    cb();
  });
});

gulp.task('electron:start', ['transpile', 'copy'], function() {
  electron.start();
});

gulp.task('electron:restart', ['transpile', 'copy'], function() {
  electron.restart();
});

gulp.task('watch', ['electron:start'], function () {
  gulp.watch(['src/**/*'], ['transpile', 'copy', 'electron:restart']);
});

gulp.task('transpile', ['check-port'], function (cb) {
  gulp.src(['src/**/*.js'])
    .pipe(cache('transpile'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('dist'))
    .on('end', cb);
});

gulp.task('copy', ['check-port'], function (cb) {
  gulp.src(['src/**/*.*', '!src/**/*.js'])
    .pipe(cache('copy'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(gulp.dest('dist'))
    .on('end', cb);
});

gulp.task('default', ['check-port', 'transpile', 'copy', 'electron:start', 'watch']);
