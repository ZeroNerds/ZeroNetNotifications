const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const del = require('del');
const runSequence = require('run-sequence');

const dist = "dist"

gulp.task("clean", function () {
  return del(dist)
})

gulp.task("devJS", function () {
  gulp.src("src/*.coffee")
    .pipe($.sourcemaps.init())
    .pipe($.coffee())
    .pipe($.concat("zeronet-notifications.js"))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(dist))
})

gulp.task("js", ["jsmin"], function () {
  gulp.src("src/*.coffee")
    //Build *.coffee files & sourcemaps => js
    .pipe($.sourcemaps.init())
    .pipe($.coffee())
    .pipe($.concat("zeronet-notifications.js"))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest(dist))
})

gulp.task("jsmin", function () {
  gulp.src("src/*.coffee")
    //Build *.coffee files & sourcemaps => js
    .pipe($.sourcemaps.init())
    .pipe($.coffee())
    .pipe($.concat("zeronet-notifications.js"))
    //Uglifiy => min.js
    .pipe($.concat("zeronet-notifications.min.js"))
    .pipe($.uglify())
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest(dist))
})

gulp.task("allJS", function () {
  gulp.src(["bower_components/jquery/dist/jquery.min.js", "bower_components/jquery.easing/js/jquery.easing.min.js", "src/*.coffee"])
    //Build *.coffee files, add libs & uglify => all.min.js
    .pipe($.sourcemaps.init())
    .pipe($.if("*.coffee", $.coffee()))
    .pipe($.uglify())
    .pipe($.concat("zeronet-notifications.all.min.js"))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest(dist))
})

gulp.task("devCSS", function () {
  gulp.src("src/*.css")
    .pipe($.concat("zeronet-notifications.css"))
    .pipe(gulp.dest(dist))
})

gulp.task("css", ["cssmin"], function () {
  gulp.src("src/*.css")
    .pipe($.sourcemaps.init())
    .pipe($.concat("zeronet-notifications.css"))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest(dist))
})

gulp.task("cssmin", function () {
  gulp.src("src/*.css")
    .pipe($.sourcemaps.init())
    .pipe($.concat("zeronet-notifications.css"))
    .pipe($.cleanCss())
    .pipe($.concat("zeronet-notifications.min.css"))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest(dist))
})

gulp.task("dev", ["clean"], function () {
  return runSequence(["devJS", "devCSS"])
})

gulp.task("default", ["clean"], function () {
  return runSequence(["js", "allJS", "css"])
})
