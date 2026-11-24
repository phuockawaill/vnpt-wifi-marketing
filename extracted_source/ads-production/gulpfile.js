/* eslint-disable */

const fs = require('fs');
const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const eslint = require('gulp-eslint');
const rename = require('gulp-rename');
const clean = require('gulp-clean');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const ejs = require('gulp-ejs');
const loopbackAngular = require('gulp-loopback-sdk-angular');
const runSequence = require('run-sequence');
const webpack = require('webpack');
const merge = require('merge-stream');

const webpackConfig = require('./webpack.build.config');
const serverConfig = require('./server/server-config');

const isPro = process.env.NODE_ENV === 'production';//process.env.NODE_ENV === 'production'
const apiUrl = process.env.API_URL || `${serverConfig.restApiScheme || 'http:'}//${serverConfig.restApiHost || 'localhost:3000'}${serverConfig.restApiRoot || '/api'}`;

// use global babel-node on window OS
// make sure npm install -g babel-cli to run script on window
const isWin = /^win/.test(process.platform);
const exec = isWin ? 'babel-node' : './node_modules/.bin/babel-node';

gulp.task('template:minify', function () {
  const files = 'server/templates/*.tpl.js';

  const stream = gulp.src(files)
    .pipe(babel());

  if (isPro) {
    stream.pipe(uglify());
  }

  return stream
    .pipe(rename(function (_path) {
      _path.basename = _path.basename.replace('.tpl', '');
      _path.extname = '.min.js';
    }))
    .pipe(gulp.dest('server/templates'));
});

gulp.task('template:compile', function () {
  const files = 'server/templates/genex-jslib.min.js';
  return gulp
    .src(files)
    .pipe(ejs({ locals: serverConfig }))
    .pipe(rename(function (_path) {
      _path.basename = _path.basename.replace('.min', '@latest.min');
    }))
    .pipe(gulp.dest('public/lib'));
});
gulp.task('templateOld:minify', function () {
  const files = 'server/templates/*.tpl.js';

  const stream = gulp.src(files)
    .pipe(babel());

  if (isPro) {
    stream.pipe(uglify());
  }

  return stream
    .pipe(rename(function (_path) {
      _path.basename = _path.basename.replace('.tpl', '');
      _path.extname = '.min.js';
    }))
    .pipe(gulp.dest('server/templates'));
});

gulp.task('templateOld:compile', function () {
  const files = 'server/templates/m-sdk.min.js';
  return gulp
    .src(files)
    .pipe(ejs({ locals: serverConfig }))
    .pipe(rename(function (_path) {
      _path.basename = _path.basename.replace('.min', '@latest.min');
    }))
    .pipe(gulp.dest('public/lib'));
});

gulp.task('templateOld', function (cb) {
  return runSequence(
    'templateOld:minify',
    'templateOld:compile', cb);
});

gulp.task('template', function (cb) {
  return runSequence(
    'template:minify',
    'template:compile', cb);
});

// ESLint configuration
gulp.task('lint', function () {
  return gulp
    .src([
      'common/**/*.js', '!server/templates/**/*.js',
      'server/**/*.js',
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// This task wraps around the three tasks below
gulp.task('loopback', function (cb) {
  return runSequence(
    'loopback:before',
    'loopback:codegen',
    'loopback:after',
    cb);
});

// Set the ENV env var to 'codegen' to skip some boot scripts.
gulp.task('loopback:before', function () {
  process.env.GENERATING_SDK = true;
  process.env.OLD_NODE_ENV = process.env.NODE_ENV;
  process.env.NODE_ENV = 'build';
});

// Restore the original value of the ENV env var store by the loopback:before script
gulp.task('loopback:after', function () {
  delete process.env.GENERATING_SDK;
  process.env.NODE_ENV = process.env.OLD_NODE_ENV;
});

// The actual generation of the LoopBack Angular SDK
gulp.task('loopback:codegen', function () {
  const gencode = gulp
    .src('server/server.dev.js')
    .pipe(loopbackAngular({ apiUrl }))
    .pipe(rename('lb-services.js'))
    .pipe(gulp.dest('./client/lib'));
  return gencode;
});

// Serve the LoopBack server with nodemon
gulp.task('serve', function () {
  return nodemon({
    exec,
    script: 'server/server.dev.js',
    watch: ['server/', 'common/'],
    ext: 'js json'
  });
});

gulp.task('clean', function () {
  return gulp
    .src('dist', { read: false })
    .pipe(clean());
});

gulp.task('config', function (cb) {
  const clientConfig = require('./server/client-config');
  fs.writeFile('client/lib/config.json', JSON.stringify(clientConfig, null, 2), cb)
});

gulp.task('webpack', function (cb) {
  return webpack(webpackConfig, function (err) {
    if (err) throw err;
    cb();
  });
});

gulp.task('server', function () {
  return merge([
    gulp
      .src(['server/**/*.js'])
      .pipe(babel())
      .pipe(gulp.dest('dist/server')),
    gulp
      .src(['server/**/*.json', 'server/**/*.ejs', 'server/**/*.pem', 'server/templates/*.pdf'])
      .pipe(gulp.dest('dist/server')),
  ]);
});

// The default tasks
gulp.task('default', function (cb) {
  runSequence('lint', 'loopback', 'config', 'serve', cb);
});

// Build
gulp.task('build', function (cb) {
  runSequence(
    [ 'clean', 'lint' ],
    [ 'loopback', 'template', 'config' ],
    'server', cb
  );
});
