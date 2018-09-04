let angularTemplatecache = require('gulp-angular-templatecache');
let argv = require('yargs').argv;
let concat = require('gulp-concat');
let del = require('del');
let eventStream = require('event-stream');
let gulp = require('gulp');
let hawtio = require('@hawtio/node-backend');
let If = require('gulp-if');
let less = require('gulp-less');
let logger = require('js-logger');
let ngAnnotate = require('gulp-ng-annotate');
let path = require('path');
let rename = require("gulp-rename");
let replace = require("gulp-replace");
let sourcemaps = require('gulp-sourcemaps');
let typescript = require('gulp-typescript');
let Server = require('karma').Server;
let packageJson = require('./package.json');

const config = {
  targetPath: argv.path || '/hawtio/jolokia',
  logLevel: argv.debug ? logger.DEBUG : logger.INFO,
  templates: ['plugins/**/*.html', 'plugins/**/*.md'],
  less: ['plugins/**/*.less', 'vendor/**/*.less', 'vendor/**/*.css'],
  templateModule: 'hawtio-integration-templates',
  dist: argv.out || './dist/',
  js: 'hawtio-integration.js',
  dts: 'hawtio-integration.d.ts',
  css: 'hawtio-integration.css',
  sourceMap: argv.sourcemap,
  vendorJs: './vendor/**/*.js',
  vendorCss: './vendor/**/*.css',
  sourceMap: argv.sourcemap,
  srcImg: './img/**/*',
  distImg: './dist/img',
};

const tsProject = typescript.createProject('tsconfig.json');

gulp.task('tsc', function () {
  var tsResult = tsProject.src()
    .pipe(If(config.sourceMap, sourcemaps.init()))
    .pipe(tsProject());

  return eventStream.merge(
    tsResult.js
      .pipe(ngAnnotate())
      .pipe(If(config.sourceMap, sourcemaps.write()))
      .pipe(gulp.dest('.')),
    tsResult.dts
      .pipe(rename(config.dts))
      .pipe(gulp.dest(config.dist)));
});

gulp.task('template', ['tsc'], function () {
  return gulp.src(config.templates)
    .pipe(angularTemplatecache({
      filename: 'templates.js',
      root: 'plugins/',
      standalone: true,
      module: config.templateModule,
      templateFooter: '}]); hawtioPluginLoader.addModule("' + config.templateModule + '");'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('concat', ['template'], function () {
  return gulp.src([config.vendorJs, 'compiled.js', 'templates.js'])
    .pipe(concat(config.js))
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function () {
  del(['templates.js', 'compiled.js']);
});

gulp.task('less', function () {
  let pluginsCss = gulp.src(config.less)
    .pipe(less({
      paths: [
        path.join(__dirname, 'plugins'),
        path.join(__dirname, 'node_modules')
      ]
    }));
  let vendorCss = gulp.src(config.vendorCss);
  return eventStream.merge(pluginsCss, vendorCss)
    .pipe(concat(config.css))
    .pipe(gulp.dest(config.dist));
});

gulp.task('copy-images', function () {
  return gulp.src(config.srcImg)
    .pipe(gulp.dest(config.distImg));
});

gulp.task('watch-less', function () {
  gulp.watch(config.less, ['less']);
});

gulp.task('watch', ['build', 'watch-less'], function () {
  gulp.watch(['index.html', config.dist + '*'], ['reload']);

  const tsconfig = require('./tsconfig.json');
  gulp.watch([...tsconfig.include, ...(tsconfig.exclude || []).map(e => `!${e}`), config.templates],
    ['tsc', 'template', 'concat', 'clean']);
});

gulp.task('connect', ['watch'], function () {
  hawtio.setConfig({
    logLevel: config.logLevel,
    port: 2772,
    proxy: '/integration/proxy',
    staticProxies: [{
      path: '/integration/jolokia',
      targetPath: config.targetPath
    }],
    staticAssets: [{
      path: '/integration/',
      dir: '.'
    }],
    fallback: 'index.html',
    liveReload: {
      enabled: true
    }
  });
  hawtio.use('/', function (req, res, next) {
    var path = req.originalUrl;
    if (path === '/') {
      res.redirect('/integration');
    } else if (path.startsWith('/plugins/') && path.endsWith('html')) {
      // avoid returning these files, they should get pulled from js
      if (argv.debug) {
        console.log("returning 404 for: ", path);
      }
      res.statusCode = 404;
      res.end();
    } else {
      if (argv.debug) {
        console.log("allowing: ", path);
      }
      next();
    }
  });
  hawtio.listen(function (server) {
    var host = server.address().address;
    var port = server.address().port;
    console.log("started from gulp file at ", host, ":", port);
  });
});

gulp.task('reload', function () {
  gulp.src('.')
    .pipe(hawtio.reload());
});

gulp.task('test', ['build'], function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('version', function () {
  gulp.src(config.dist + config.js)
    .pipe(replace('PACKAGE_VERSION_PLACEHOLDER', packageJson.version))
    .pipe(gulp.dest(config.dist));
});

gulp.task('build', ['tsc', 'less', 'template', 'concat', 'clean', 'copy-images']);

gulp.task('default', ['connect']);
