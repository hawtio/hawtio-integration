// Karma configuration
// Generated on Thu Nov 23 2017 10:43:14 GMT-0200 (-02)

process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/datatables.net/js/jquery.dataTables.js',
      'node_modules/datatables.net-select/js/dataTables.select.js',
      'node_modules/bootstrap/dist/js/bootstrap.min.js',
      'node_modules/patternfly/dist/js/patternfly.min.js',
      'node_modules/patternfly-bootstrap-treeview/dist/bootstrap-treeview.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-animate/angular-animate.min.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/angular-route/angular-route.min.js',
      'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
      'node_modules/angular-resizable/angular-resizable.min.js',
      'node_modules/angular-drag-and-drop-lists/angular-drag-and-drop-lists.min.js',
      'node_modules/angularjs-datatables/dist/angular-datatables.min.js',
      'node_modules/angularjs-datatables/dist/plugins/select/angular-datatables.select.min.js',
      'node_modules/angular-cookies/angular-cookies.min.js',
      'node_modules/angular-patternfly/dist/angular-patternfly.js',
      'node_modules/c3/c3.min.js',
      'node_modules/d3/d3.min.js',
      'node_modules/lodash/lodash.min.js',
      'node_modules/urijs/src/URI.min.js',
      'node_modules/js-logger/src/logger.min.js',
      'node_modules/marked/lib/marked.js',
      'node_modules/clipboard/dist/clipboard.js',
      'node_modules/graphlib/dist/graphlib.core.min.js',
      'node_modules/dagre-layout/dist/dagre-layout.js',
      'node_modules/ng-infinite-scroll/build/ng-infinite-scroll.min.js',
      'node_modules/@hawtio/core/dist/hawtio-core.js',
      'dist/hawtio-integration.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'plugins/**/*.spec.ts',
      {pattern: 'hawtconfig.json', watched: false, included: false, served: true}
    ],


    proxies: {
      "/hawtconfig.json": "/base/hawtconfig.json"
    },


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.ts': ['typescript']
    },


    // test results reporter to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,


    // Add base tag to test page
    customContextFile: '.karma/context.html'
  })
}
