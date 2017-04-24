var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    del = require('del'),
    fs = require('fs'),
    path = require('path'),
    s = require('underscore.string'),
    argv = require('yargs').argv,
    urljoin = require('url-join'),
    logger = require('js-logger'),
    hawtio = require('hawtio-node-backend');

var plugins = gulpLoadPlugins({});
var pkg = require('./package.json');

var config = {
  proxyPort: argv.port || 8181,
  targetPath: argv.path || '/jolokia',
  logLevel: argv.debug ? logger.DEBUG : logger.INFO,
  main: '.',
  ts: ['plugins/**/*.ts'],
  templates: ['plugins/**/*.html'],
  less: ['plugins/**/*.less', 'vendor/**/*.less', 'vendor/**/*.css'],
  templateModule: pkg.name + '-templates',
  dist: argv.out || './dist/',
  js: pkg.name + '.js',
  css: pkg.name + '.css',
  tsProject: plugins.typescript.createProject({
    target: 'ES5',
    outFile: 'compiled.js',
    declaration: true,
    noResolve: false
  }),
  sourceMap: argv.sourcemap
};

gulp.task('bower', function() {
  return gulp.src('index.html')
    .pipe(wiredep({}))
    .pipe(gulp.dest('.'));
});

/** Adjust the reference path of any typescript-built plugin this project depends on */
gulp.task('path-adjust', function() {
  return eventStream.merge(
    gulp.src('libs/**/includes.d.ts')
      .pipe(plugins.replace(/"\.\.\/libs/gm, '"../../../libs'))
      .pipe(gulp.dest('libs')),
    gulp.src('libs/**/defs.d.ts')
      .pipe(plugins.replace(/"libs/gm, '"../../libs'))
      .pipe(gulp.dest('libs'))
  );
});

gulp.task('clean-defs', function() {
  return del('defs.d.ts');
});

gulp.task('tsc', ['clean-defs'], function() {
  var cwd = process.cwd();
  var tsResult = gulp.src(config.ts)
    .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.init()))
    .pipe(plugins.typescript(config.tsProject()));

  return eventStream.merge(
    tsResult.js
      .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.write()))
      .pipe(gulp.dest('.')),
    tsResult.dts
      .pipe(plugins.rename('defs.d.ts'))
      .pipe(gulp.dest('.')));
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
  return gulp.src(['compiled.js', 'templates.js', 'vendor/**/*.js'])
    .pipe(plugins.concat(config.js))
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function() {
  return del(['templates.js', 'compiled.js']);
});

gulp.task('less', function () {
  return gulp.src(config.less)
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'plugins'), path.join(__dirname, 'libs')]
    }))
    .pipe(plugins.concat(config.css))
    .pipe(gulp.dest(config.dist));
});

gulp.task('watch-less', function() {
  plugins.watch(config.less, function() {
    gulp.start('less');
  });
});

gulp.task('watch', ['build', 'watch-less'], function() {
  plugins.watch(['libs/**/*.js', 'libs/**/*.css', 'index.html', urljoin(config.dist, '*')], function() {
    gulp.start('reload');
  });
  plugins.watch(['libs/**/*.d.ts', config.ts, config.templates], function() {
    gulp.start(['tsc', 'template', 'concat', 'clean']);
  });
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

gulp.task('build', ['bower', 'path-adjust', 'tsc', 'less', 'template', 'concat', 'clean']);

gulp.task('default', ['connect']);



