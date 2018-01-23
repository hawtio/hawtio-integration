let angularTemplatecache = require('gulp-angular-templatecache');
let argv = require('yargs').argv;
let concat = require('gulp-concat');
let del = require('del');
let eventStream = require('event-stream');
let fs = require('fs');
let gulp = require('gulp');
let gulpif = require('gulp-if');
let gulpLoadPlugins = require('gulp-load-plugins');
let hawtio = require('@hawtio/node-backend');
let less = require('gulp-less');
let logger = require('js-logger');
let ngAnnotate = require('gulp-ng-annotate');
let path = require('path');
let rename = require("gulp-rename");
let sequence = require('run-sequence');
let sourcemaps = require('gulp-sourcemaps');
let typescript = require('gulp-typescript');
let Server = require('karma').Server;

const plugins  = gulpLoadPlugins({});

let config = {
  proxyPort: argv.port || 8181,
  targetPath: argv.path || '/hawtio/jolokia',
  logLevel: argv.debug ? logger.DEBUG : logger.INFO,
  ts: ['plugins/**/*.ts'],
  templates: ['plugins/**/*.html', 'plugins/**/*.md'],
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
  var tsResult = config.tsProject.src()
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

gulp.task('clean', () => del(['templates.js', 'compiled.js', './site/']));

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
    proxy: '/integration/proxy',
    staticProxies: [{
      port: config.proxyPort,
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
  hawtio.use('/', function(req, res, next) {
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

gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('site-fonts', () =>
  gulp
    .src(
      [
        'node_modules/**/*.woff',
        'node_modules/**/*.woff2',
        'node_modules/**/*.ttf',
        'node_modules/**/fonts/*.eot',
        'node_modules/**/fonts/*.svg'
      ],
      { base: '.' }
    )
    .pipe(plugins.flatten())
    .pipe(plugins.chmod(0o644))
    .pipe(plugins.dedupe({ same: false }))
    .pipe(plugins.debug({ title: 'site font files' }))
    .pipe(gulp.dest('site/fonts/', { overwrite: false }))
);

gulp.task('site-files', () => gulp.src(['images/**', 'img/**'], { base: '.' })
  .pipe(plugins.chmod(0o644))
  .pipe(plugins.dedupe({ same: false }))
  .pipe(plugins.debug({ title: 'site files' }))
  .pipe(gulp.dest('site')));

gulp.task('usemin', () => gulp.src('index.html')
  .pipe(plugins.usemin({
    css: [plugins.minifyCss({ keepBreaks: true }), 'concat'],
    js : [plugins.uglify(), plugins.rev()],
  }))
  .pipe(plugins.debug({ title: 'usemin' }))
  .pipe(gulp.dest('site')));

gulp.task('tweak-urls', ['usemin', 'site-config'], () => eventStream.merge(
  gulp.src('site/style.css')
    .pipe(plugins.replace(/url\(\.\.\//g, 'url('))
    // tweak fonts URL coming from PatternFly that does not repackage then in dist
    .pipe(plugins.replace(/url\(\.\.\/components\/font-awesome\//g, 'url('))
    .pipe(plugins.replace(/url\(\.\.\/components\/bootstrap\/dist\//g, 'url('))
    .pipe(plugins.replace(/url\(node_modules\/bootstrap\/dist\//g, 'url('))
    .pipe(plugins.replace(/url\(node_modules\/patternfly\/components\/bootstrap\/dist\//g, 'url('))
    .pipe(plugins.debug({title: 'tweak-urls'}))
    .pipe(gulp.dest('site')),
  gulp.src('site/hawtconfig.json')
  .pipe(plugins.replace(/node_modules\/@hawtio\/core\/dist\//g, ''))
  .pipe(gulp.dest('site'))));

gulp.task('copy-site-images', function () {
  const dirs = fs.readdirSync('./node_modules/@hawtio');
  const patterns = [];
  dirs.forEach(function (dir) {
    const path = './node_modules/@hawtio/' + dir + '/dist/img';
    try {
      if (fs.statSync(path).isDirectory()) {
        console.log('found image dir: ', path);
        const pattern = 'node_modules/@hawtio/' + dir + '/dist/img/**';
        patterns.push(pattern);
      }
    } catch (e) {
      // ignore, file does not exist
    }
  });
  // Add PatternFly images package in dist
  patterns.push('node_modules/patternfly/dist/img/**');
  return gulp.src(patterns)
    .pipe(plugins.debug({title: 'img-copy'}))
    .pipe(plugins.chmod(0o644))
    .pipe(gulp.dest('site/img'));
});

gulp.task('site-config', () => gulp.src('hawtconfig.json')
  .pipe(gulp.dest('site')));

gulp.task('serve-site', function () {
  hawtio.setConfig({
    port: 2772,
    staticAssets: [{
      path : '/integration',
      dir  : 'site',
    }],
    fallback: 'site/index.html',
    liveReload : {
      enabled : false,
    },
  });

  hawtio.use('/', function(req, res, next) {
    if (!req.originalUrl.startsWith('/integration')) {
      res.redirect('/integration');
    } else {
      next();
    }
  });

  return hawtio.listen(server => console.log(`Hawtio console started at http://localhost:${server.address().port}`));
});

gulp.task('build', ['tsc', 'less', 'template', 'concat', 'clean', 'copy-images']);

gulp.task('site', callback => sequence('clean', ['site-fonts', 'site-files', 'usemin', 'tweak-urls', 'copy-site-images', 'site-config'], callback));

gulp.task('default', ['connect']);
