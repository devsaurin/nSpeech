const gulp = require('gulp');
const plugins = require("gulp-load-plugins")({ lazy:false });
const browserSync   = require('browser-sync');
const runSequence   = require('run-sequence');
const rollup = require('rollup');
const uglify = require('rollup-plugin-uglify');
const minify = require('uglify-es').minify;
const Promise = require('promise');
const del = require('del');

const autoprefixerSetting = {
  browsers: ['last 2 versions'],
  cascade: false
};

const dir = {
  src: 'src',
  dist: 'dist',
  demo: 'demo'
};

const nSpeechPath = dir.src + '/js/nSpeech.js';
const nSpeechDistPath = dir.dist + '/nSpeech.js';


gulp.task('sass', function () {
  return gulp.src( [dir.demo + '/sass/**/*.scss'] )
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.sass({ outputStyle: 'nested' }).on('error', plugins.sass.logError))
  .pipe(plugins.autoprefixer(autoprefixerSetting))
  .pipe(plugins.sourcemaps.write())
  .pipe(gulp.dest(dir.demo))
  .pipe(browserSync.stream());
});


gulp.task("browser-sync", function () {
  browserSync.init({
    server: { baseDir: dir.demo + '/' }
  });
});


gulp.task("reload", function () {
  browserSync.reload();
});


gulp.task('watch', function (cb) {

  runSequence(
    'sass',
    'build',
    'browser-sync',
    function () {
      gulp.watch([dir.demo + '/**/*.html'], ['reload']);

      gulp.watch([dir.demo + '/**/*.scss'], ['sass']);

      gulp.watch([dir.demo + '/**/*.js'], ["reload"]);

      // javascriptの監視
      gulp.watch([nSpeechPath], ["build"]);
      gulp.watch([nSpeechDistPath], ["copy-demo"]);
      return cb;
    }
  );
});

gulp.task('build', function () {
  return rollup.rollup({
    input: nSpeechPath
  }).then(function (bundle) {
    const amd = bundle.write({
      file: dir.dist + '/index.amd.js',
      format: "amd"
    });

    const cjs = bundle.write({
      file: dir.dist + '/index.js',
      format: "cjs"
    });

    const es = bundle.write({
      file: dir.dist + '/index.es.js',
      format: "es"
    });

    const iife = bundle.write({
      file: dir.dist + '/nSpeech.js',
      name: 'nSpeech',
      format: 'iife'
    });

    return Promise.all([amd, cjs, es, iife]);

  });
});


gulp.task('copy-demo', function () {
  return gulp.src([nSpeechDistPath])
  .pipe(gulp.dest(dir.demo + '/js'));
});

gulp.task('jsmin', function () {
  return rollup.rollup({
    input: nSpeechPath,
    plugins: [uglify( { output: { comments: /^!/ } }, minify )]
  }).then(function (bundle) {
    return bundle.write({
      file: dir.dist + '/nSpeech.min.js',
      name: 'nSpeech',
      format: "iife"
    });
  });
});

gulp.task('lint', function () {
  return gulp.src([nSpeechPath])
  .pipe(plugins.eslint())
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failAfterError());
});

gulp.task('clean', function () {
  return del(['dist']);
});

gulp.task('prepublish', function () { return runSequence(['clean', 'build']); });

gulp.task('default', ['watch']);

gulp.task('test', ['lint']);

gulp.task('dist', ['build', 'jsmin']);
