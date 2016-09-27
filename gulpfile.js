const gulp        = require('gulp');
const babel       = require('gulp-babel');
const sass        = require('gulp-sass');
const sourcemaps  = require('gulp-sourcemaps');
const debug       = require('gulp-debug');
const cache       = require('gulp-cached');
const plumber     = require('gulp-plumber');
const replace     = require('gulp-replace-task');
const notify      = require("gulp-notify");
const electron    = require('electron-connect').server.create();
const tcpPortUsed = require('tcp-port-used');
const CONFIG      = require('./src/config');

/**
 * Settings
 */
const plumberConfig = {
  errorHandler: notify.onError({
    title:    "Gulp error!",
    message:  "<%= error.message %>",
  })
};

const debugConfig = (taskName) => {
  return {
    title: 'Task \'' + taskName + '\' -'
  };
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
gulp.task('electron:start',           ['build', 'check-port'],  () => electron.start());
gulp.task('electron:restart',         ['transpile:server'],     () => electron.restart());
gulp.task('electron:reload:html',     ['copy:html'],            () => electron.reload());
gulp.task('electron:reload:js',       ['transpile:client'],     () => electron.reload());
gulp.task('electron:reload:css',      ['sass'],                 () => electron.reload());


/**
 * Files tasks
 */
gulp.task('transpile:server', function (callback) {
  gulp.src(['src/**/*.js', '!src/client/*'])
    .pipe(plumber(plumberConfig))
    .pipe(cache('transpile'))
    .pipe(debug(debugConfig('transpile:server')))
    .pipe(replace(replaceOptions))
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('dist'))
    .on('end', callback);
});

gulp.task('transpile:client', function (callback) {
  gulp.src(['src/client/**/*.js'])
    .pipe(plumber(plumberConfig))
    .pipe(cache('transpile'))
    .pipe(debug(debugConfig('transpile:client')))
    .pipe(replace(replaceOptions))
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('dist/client'))
    .on('end', callback);
});

gulp.task('sass', function (callback) {
  gulp.src(['src/client/styles/**/*.sass'])
    .pipe(plumber(plumberConfig))
    .pipe(debug(debugConfig('sass')))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: [
        './node_modules/bootstrap/scss/',
        './node_modules/font-awesome/scss/',
        './node_modules/z-switch/sass/',
      ]
      }).on('error', sass.logError))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/client/styles'))
    .on('end', callback);
});

gulp.task('copy:html', function (callback) {
  gulp.src(['src/client/**/*.html'])
    .pipe(plumber(plumberConfig))
    .pipe(cache('copy'))
    .pipe(debug(debugConfig('copy:html')))
    .pipe(replace(replaceOptions))
    .pipe(gulp.dest('dist/client/'))
    .on('end', callback);
});

gulp.task('copy:assets', function (callback) {
  gulp.src(['src/client/**/*.*', '!src/client/**/*.{js,css,sass,html}'])
    .pipe(plumber(plumberConfig))
    .pipe(cache('copy'))
    .pipe(debug(debugConfig('copy:assets')))
    .pipe(replace(replaceOptions))
    .pipe(gulp.dest('dist/client/'))
    .on('end', callback);
});

gulp.task('build', ['transpile:server', 'transpile:client', 'sass', 'copy:assets', 'copy:html']);


/**
 * Watch task
 */
gulp.task('watch', function () {
  // Restart electron when server or electron js files change
  gulp.watch(['src/**/*.js', '!src/client/**/*.js'], ['electron:restart']);

  // Reload electron when client files change
  gulp.watch(['src/client/**/*.html'], ['electron:reload:html']);
  gulp.watch(['src/client/scripts/**/*.js'], ['electron:reload:js']);
  gulp.watch(['src/client/styles/**/*.sass'], ['electron:reload:css']);
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
