let angularTemplatecache = require('gulp-angular-templatecache');
let argv = require('yargs').argv;
let concat = require('gulp-concat');
let del = require('del');
let eventStream = require('event-stream');
let gulp = require('gulp');
let gulpif = require('gulp-if');
let hawtio = require('@hawtio/node-backend');
let less = require('gulp-less');
let logger = require('js-logger');
let ngAnnotate = require('gulp-ng-annotate');
let path = require('path');
let rename = require("gulp-rename");
let sourcemaps = require('gulp-sourcemaps');
let typescript = require('gulp-typescript');

let config = {
  proxyPort: argv.port || 8181,
  targetPath: argv.path || '/hawtio/jolokia',
  logLevel: argv.debug ? logger.DEBUG : logger.INFO,
  ts: ['plugins/**/*.ts'],
  templates: ['plugins/**/*.html', 'plugins/**/doc/*.md'],
  less: ['plugins/**/*.less', 'vendor/**/*.less', 'vendor/**/*.css'],
  templateModule: 'hawtio-integration-templates',
  dist: argv.out || './dist/',
  js: 'hawtio-integration.js',
  dts: 'hawtio-integration.d.ts',
  css: 'hawtio-integration.css',
  tsProject: typescript.createProject('tsconfig.json'),
  sourceMap: argv.sourcemap,
  vendorJs: './vendor/**/*.js',
  vendorCss: './vendor/**/*.css',
  srcImg: './img/**/*',
  distImg: './dist/img'
};

gulp.task('clean-defs', function() {
  return del(config.dist + '*.d.ts');
});

gulp.task('tsc', ['clean-defs'], function() {
  var tsResult = gulp.src(config.ts)
    .pipe(gulpif(config.sourceMap, sourcemaps.init()))
    .pipe(config.tsProject());

  return eventStream.merge(
    tsResult.js
      .pipe(ngAnnotate())
      .pipe(gulpif(config.sourceMap, sourcemaps.write()))
      .pipe(gulp.dest('.')),
    tsResult.dts
      .pipe(rename(config.dts))
      .pipe(gulp.dest(config.dist)));
});

gulp.task('template', ['tsc'], function() {
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

gulp.task('concat', ['template'], function() {
  return gulp.src([config.vendorJs, 'compiled.js', 'templates.js'])
    .pipe(concat(config.js))
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function() {
  return del(['templates.js', 'compiled.js']);
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

gulp.task('copy-images', function() {
  return gulp.src(config.srcImg)
    .pipe(gulp.dest(config.distImg));
});

gulp.task('watch-less', function() {
  gulp.watch(config.less, ['less']);
});

gulp.task('watch', ['build', 'watch-less'], function() {
  gulp.watch(['index.html', config.dist + '*'], ['reload']);
  gulp.watch([config.ts, config.templates], ['tsc', 'template', 'concat', 'clean']);
});

gulp.task('connect', ['watch'], function() {
  hawtio.setConfig({
    logLevel: config.logLevel,
    port: 2772,
    proxy: '/hawtio/proxy',
    staticProxies: [{
      port: config.proxyPort,
      path: '/hawtio/jolokia',
      targetPath: config.targetPath
    }],
    staticAssets: [{
      path: '/hawtio/',
      dir: '.'

    }],
    fallback: 'index.html',
    liveReload: {
      enabled: true
    }
  });
  hawtio.use('/', function(req, res, next) {
    var path = req.originalUrl;
    if (path === '/') {
      res.writeHead(302, {Location: '/hawtio'});
      res.end();
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
  hawtio.listen(function(server) {
    var host = server.address().address;
    var port = server.address().port;
    console.log("started from gulp file at ", host, ":", port);
  });
});

gulp.task('reload', function() {
  gulp.src('.')
    .pipe(hawtio.reload());
});

gulp.task('build', ['tsc', 'less', 'template', 'concat', 'clean', 'copy-images']);

gulp.task('default', ['connect']);
