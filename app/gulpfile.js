var gulp       = require('gulp');
var nodemon    = require('gulp-nodemon');
// var sass       = require('gulp-sass');
// var livereload = require('gulp-livereload');

gulp.task('develop', function () {
  nodemon({
    script: 'app.js', 
    ext: 'js hjs json', 
    legacyWatch: true, 
    'exec': 'node --inspect=0.0.0.0:5858' });
});

// gulp.task('sass', function() {
//   gulp
//     .src('./public/scss/**/*.scss')
//     .pipe(sass())
//     .pipe(gulp.dest('./public/css'))
//     // .pipe(livereload())
//     .on('error', function (err) {
//       console.log(err.message);
//     })
//   ;
// });

// gulp.watch('./public/scss/**/*.scss', ['sass']);

gulp.task('default', ['develop']);
