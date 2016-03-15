var gulp = require('gulp');
var babel = require('gulp-babel');
var debug = require('gulp-debug');
var cache = require('gulp-cached');
var replace = require('gulp-replace-task');
var electron = require('electron-connect').server.create();
var async = require('async');
var CONFIG = require('./src/config');

var replaceOptions = {
  patterns: [
    {
      match: 'PORT',
      replace: CONFIG.PORT
    }
  ]
};

gulp.task('electron:start', ['transpile', 'copy'], function() {
  electron.start();
});

gulp.task('electron:restart', ['transpile', 'copy'], function() {
  electron.restart();
});

gulp.task('watch', ['electron:start'], function () {
  gulp.watch(['src/**/*'], ['transpile', 'copy', 'electron:restart']);
});

gulp.task('transpile', function (cb) {
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

gulp.task('copy', function (cb) {
  gulp.src(['src/**/*.*', '!src/**/*.js'])
    .pipe(cache('copy'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(gulp.dest('dist'))
    .on('end', cb);
});

gulp.task('default', ['transpile', 'copy', 'electron:start', 'watch']);
