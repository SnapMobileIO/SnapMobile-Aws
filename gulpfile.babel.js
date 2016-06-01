'use strict';

import gulp from 'gulp';
import babel from 'gulp-babel';
import gutil from 'gulp-util';

function handleError(error) {
  gutil.log(gutil.colors.magenta(error.message));
  if (error.stack) { gutil.log(gutil.colors.cyan(error.stack)); }
  process.exit(1);
}

gulp.task('babel', function() {
  return gulp.src(['./src/aws/*.js'])
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('./dist/aws'))
    .on('error', handleError);
});

gulp.task('dist', ['babel']);