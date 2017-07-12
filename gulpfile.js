var gulp = require('gulp'),
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    del = require('del'),
    fs = require('fs'),
    path = require('path'),
    s = require('underscore.string'),
    argv = require('yargs').argv,
    urljoin = require('url-join'),
    logger = require('js-logger'),
    hawtio = require('@hawtio/node-backend');

var plugins = gulpLoadPlugins({});

var config = {
  proxyPort: argv.port || 8181,
  targetPath: argv.path || '/jolokia',
  logLevel: argv.debug ? logger.DEBUG : logger.INFO,
  ts: ['plugins/**/*.ts'],
  templates: ['plugins/**/*.html', 'plugins/**/doc/*.md'],
  less: ['plugins/**/*.less', 'vendor/**/*.less', 'vendor/**/*.css'],
  templateModule: 'hawtio-integration-templates',
  dist: argv.out || './dist/',
  js: 'hawtio-integration.js',
  dts: 'hawtio-integration.d.ts',
  css: 'hawtio-integration.css',
  tsProject: plugins.typescript.createProject('tsconfig.json'),
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
    .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.init()))
    .pipe(config.tsProject());

  return eventStream.merge(
    tsResult.js
      .pipe(plugins.ngAnnotate())
      .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.write()))
      .pipe(gulp.dest('.')),
    tsResult.dts
      .pipe(plugins.rename(config.dts))
      .pipe(gulp.dest(config.dist)));
});

gulp.task('template', ['tsc'], function() {
  return gulp.src(config.templates)
    .pipe(plugins.angularTemplatecache({
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
    .pipe(plugins.concat(config.js))
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function() {
  return del(['templates.js', 'compiled.js']);
});

gulp.task('less', function () {
  let pluginsCss = gulp.src(config.less)
    .pipe(plugins.less({
      paths: [
        path.join(__dirname, 'plugins'),
        path.join(__dirname, 'node_modules')
      ]
    }));
  let vendorCss = gulp.src(config.vendorCss);
  return eventStream.merge(pluginsCss, vendorCss)
    .pipe(plugins.concat(config.css))
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
  gulp.watch(['index.html', urljoin(config.dist, '*')], ['reload']);
  gulp.watch([config.ts, config.templates], ['tsc', 'template', 'concat', 'clean']);
});

gulp.task('connect', ['watch'], function() {
  hawtio.setConfig({
    logLevel: config.logLevel,
    port: 2772,
    staticProxies: [{
      port: config.proxyPort,
      path: '/jolokia',
      targetPath: config.targetPath
    }],
    staticAssets: [{
      path: '/',
      dir: '.'

    }],
    fallback: 'index.html',
    liveReload: {
      enabled: true
    }
  });
  hawtio.use('/', function(req, res, next) {
          var path = req.originalUrl;
          // avoid returning these files, they should get pulled from js
          if (s.startsWith(path, '/plugins/') && s.endsWith(path, 'html')) {
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



