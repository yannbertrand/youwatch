const gulp = require('gulp');
const babel = require('gulp-babel');
const debug = require('gulp-debug');
const cache = require('gulp-cached');
const plumber = require('gulp-plumber');
const replace = require('gulp-replace-task');
const notify = require("gulp-notify");
const electron = require('electron-connect').server.create();
const async = require('async');
const tcpPortUsed = require('tcp-port-used');
const CONFIG = require('./src/config');

const errorTemplate = '<%= error.message %>';
const replaceOptions = {
  patterns: [
    {
      match: 'PORT',
      replace: CONFIG.PORT
    }
  ]
};


gulp.task('default', ['transpile', 'copy', 'check-port', 'electron:start', 'watch']);



gulp.task('electron:start', ['transpile', 'copy', 'check-port'], () => electron.start());

gulp.task('transpile', function (callback) {
  gulp.src(['src/**/*.js'])
    .pipe(plumber({ errorHandler: notify.onError(errorTemplate)}))
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
    .pipe(plumber({ errorHandler: notify.onError(errorTemplate) }))
    .pipe(cache('copy'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(plumber.stop())
    .pipe(gulp.dest('dist'))
    .on('end', callback);
});

gulp.task('watch', function () {
  gulp.watch(['src/**/*.js', '!src/client/*'], ['transpile', electron.restart]);

  gulp.watch(['src/client/**/*.{html,css}'], ['copy', electron.reload]);
  gulp.watch(['src/client/**/*.js'], ['transpile', electron.reload]);
});

gulp.task('check-port', function (callback) {
  isPortUsed(CONFIG.PORT, function (err, portInUse) {
    if (err)
      return callback('An unknown error occured');
    if (portInUse)
      return callback('The port ' + CONFIG.PORT + ' is already in use');
  
    callback();
  });
});



function isPortUsed(port, callback) {
  tcpPortUsed
    .check(port, '127.0.0.1')
    .then(function (inUse) {
      callback(null, inUse);
    }, function (err) {
      callback(err);
  });
};
