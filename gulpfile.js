var gulp = require('gulp');
var electron = require('electron-connect').server.create();

gulp.task('electron:restart', function() {
  electron.restart();
});

gulp.task('watch', function () {
  electron.start();
  gulp.watch('./src/**/*.html', ['electron:restart']);
  gulp.watch('./src/**/*.js', ['electron:restart']);
  gulp.watch('./src/**/*.css', ['electron:restart']);
});

// gulp
gulp.task('default', [
  'watch'
]);