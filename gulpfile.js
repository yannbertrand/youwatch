const gulp        = require('gulp');
const babel       = require('gulp-babel');
const debug       = require('gulp-debug');
const cache       = require('gulp-cached');
const plumber     = require('gulp-plumber');
const replace     = require('gulp-replace-task');
const notify      = require("gulp-notify");
const electron    = require('electron-connect').server.create();
const async       = require('async');
const tcpPortUsed = require('tcp-port-used');
const CONFIG      = require('./src/config');

/**
 * Settings
 */
const errorTemplate = {
  title:    "Gulp error!",
  message:  "<%= error.message %>",
};
const replaceOptions = {
  patterns: [
    {
      match: 'PORT',
      replace: CONFIG.PORT
    }
  ]
};


/**
 * Electron tasks
 */
gulp.task('electron:start', ['transpile:server', 'transpile:client', 'copy', 'check-port'], () => electron.start());
gulp.task('electron:restart',         ['transpile:server'], electron.restart);
gulp.task('electron:reload:htmlcss',  ['copy'],             electron.reload);
gulp.task('electron:reload:js',       ['transpile:client'], electron.reload);


/**
 * Files tasks
 */
gulp.task('transpile:server', function () {
  gulp.src(['src/**/*.js', '!src/client/*'])
    .pipe(plumber({ errorHandler: notify.onError(errorTemplate)}))
    .pipe(cache('transpile'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('dist'))
});

gulp.task('transpile:client', function () {
  gulp.src(['src/client/**/*.js'])
    .pipe(plumber({ errorHandler: notify.onError(errorTemplate)}))
    .pipe(cache('transpile'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('dist'))
});

gulp.task('copy', function () {
  gulp.src(['src/**/*.*', '!src/**/*.js'])
    .pipe(plumber({ errorHandler: notify.onError(errorTemplate) }))
    .pipe(cache('copy'))
    .pipe(debug())
    .pipe(replace(replaceOptions))
    .pipe(gulp.dest('dist'))
});


/**
 * Watch task
 */
gulp.task('watch', function () {
  // Restart electron when server or electron js files change
  gulp.watch(['src/**/*.js', '!src/client/*'], ['electron:restart']);

  // Reload electron when client files change
  gulp.watch(['src/client/**/*.{html,css}'], ['electron:reload:htmlcss']);
  gulp.watch(['src/client/**/*.js'], ['electron:reload:js']);
});



/** 
 * ============================================================
 *   Default task (npm start)
 *   transpile, copy, ..., then start electron & watch files
 * ============================================================
 */
gulp.task('default', ['electron:start', 'watch']);



/**
 * Utils
 */
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
