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

gulp.task("js", function () {
  gulp.src("src/*.coffee")
    //Build *.coffee files & sourcemaps => js
    .pipe($.sourcemaps.init())
    .pipe($.coffee())
    .pipe($.concat("zeronet-notifications.js"))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(dist))
    //Uglifiy => min.js
    .pipe($.concat("zeronet-notifications.min.js"))
    .pipe($.uglify())
    .pipe(gulp.dest(dist))
})

gulp.task("allJS", function () {
  gulp.src(["src/*.coffee", "bower_components/jquery/dist/jquery.min.js", "bower_components/jquery.easing/js/jquery.easing.min.js"])
    //Build *.coffee files, add libs & uglify => all.min.js
    .pipe($.if("*.coffee", $.coffee()))
    .pipe($.uglify())
    .pipe($.concat("zeronet-notifications.all.min.js"))
    .pipe(gulp.dest(dist))
})

gulp.task("devCSS", function () {
  gulp.src("src/*.css")
    .pipe($.concat("zeronet-notifications.css"))
    .pipe(gulp.dest(dist))
})

gulp.task("css", function () {
  gulp.src("src/*.css")
    .pipe($.concat("zeronet-notifications.css"))
    .pipe(gulp.dest(dist))
    .pipe($.cleanCss())
    .pipe($.concat("zeronet-notifications.min.css"))
    .pipe(gulp.dest(dist))
})

gulp.task("dev", ["clean"], function () {
  return runSequence(["devJS", "devCSS"])
})

gulp.task("default", ["clean"], function () {
  return runSequence(["js", "allJS", "css"])
})
