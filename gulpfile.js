const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const del = require('del');
const runSequence = require('run-sequence');
/*const merge = require('merge-stream');
const path = require('path');
const fs = require("fs");*/

const dist="dist"

gulp.task("clean", function() {
  return del(dist)
})

gulp.task("devJS", function() {
  gulp.src("src/*.coffee")
    .pipe($.sourcemaps.init())
    .pipe($.coffee())
    .pipe($.concat("zeronet-notifications.js"))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(dist))
})

gulp.task("js", function() {
  gulp.src("src/*.coffee")
    .pipe($.sourcemaps.init())
    .pipe($.coffee())
    .pipe($.concat("zeronet-notifications.js"))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(dist))
    .pipe($.concat("zeronet-notifications.min.js"))
    .pipe($.uglify())
    .pipe(gulp.dest(dist))
})

gulp.task("devCSS", function() {
  gulp.src("src/*.css")
    .pipe($.concat("zeronet-notifications.css"))
    .pipe(gulp.dest(dist))
})

gulp.task("css", function() {
  gulp.src("src/*.css")
    .pipe($.concat("zeronet-notifications.css"))
    .pipe(gulp.dest(dist))
    .pipe($.cleanCss())
    .pipe($.concat("zeronet-notifications.min.css"))
    .pipe(gulp.dest(dist))
})

gulp.task("dev", ["clean"], function() {
  return runSequence(["devJS","devCSS"])
})

gulp.task("default", ["clean"], function() {
  return runSequence(["js","css"])
})
