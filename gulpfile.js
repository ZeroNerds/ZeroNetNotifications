'use strict'

const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const del = require('del')

const uc = require('gulp-uglify/composer')
const es = require('uglify-es')
const ugl = uc(es, console)

const dist = 'dist'

function clean () {
  return del(dist)
}

function write () {
  return $.sourcemaps.write()
    .pipe(gulp.dest(dist))
}

function cof () {
  return $.coffee()
}

function devJS () {
  return gulp.src('src/*.coffee')
    .pipe($.sourcemaps.init())
    .pipe(cof())
    .pipe($.concat('zeronet-notifications.js'))
    .pipe(write())
}

function js () {
  return gulp.src('src/*.coffee')
    // Build *.coffee files & sourcemaps => js
    .pipe($.sourcemaps.init())
    .pipe(cof())
    .pipe($.concat('zeronet-notifications.js'))
    .pipe(write())
}

function jsmin () {
  return gulp.src('src/*.coffee')
    // Build *.coffee files & sourcemaps => js
    .pipe($.sourcemaps.init())
    .pipe(cof())
    // Uglifiy => min.js
    .pipe($.concat('zeronet-notifications.min.js'))
    .pipe(ugl())
    .pipe(write())
}

function allJS () {
  return gulp.src(['node_modules/jquery/dist/jquery.min.js', 'node_modules/jquery.easing/jquery.easing.min.js', 'src/*.coffee'])
    // Build *.coffee files, add libs & uglify => all.min.js
    .pipe($.sourcemaps.init())
    .pipe($.if('*.coffee', cof()))
    .pipe(ugl())
    .pipe($.concat('zeronet-notifications.all.min.js'))
    .pipe(write())
}

function devCSS () {
  return gulp.src('src/*.css')
    .pipe($.sourcemaps.init())
    .pipe($.concat('zeronet-notifications.css'))
    .pipe(write())
}

function css () {
  return gulp.src('src/*.css')
    .pipe($.sourcemaps.init())
    .pipe($.concat('zeronet-notifications.css'))
    .pipe(write())
}

function cssmin () {
  return gulp.src('src/*.css')
    .pipe($.sourcemaps.init())
    .pipe($.concat('zeronet-notifications.css'))
    .pipe($.cleanCss())
    .pipe($.concat('zeronet-notifications.min.css'))
    .pipe(write())
}

function watch () {
  gulp.watch('src/*.coffee', devJS)
  gulp.watch('src/*.css', devCSS)
}

Object.assign(exports, {clean, devJS, devCSS, js, jsmin, css, cssmin, allJS, watch})

gulp.task('dev', gulp.series(clean, gulp.parallel(devJS, devCSS)))
gulp.task('default', gulp.series(clean, gulp.parallel(js, jsmin, allJS, css, cssmin)))
gulp.task('w', gulp.series(clean, gulp.parallel(devJS, devCSS), watch))
