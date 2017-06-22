var testStyles = [
    //'src/main/webapp/css/*.css'
];
var thirdPartyLibs = [
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/jquery.gritter/js/jquery.gritter.min.js',
    'bower_components/jquery.scrollintoview/jquery.scrollintoview.min.js',
    'bower_components/jquery-ui-layout-bower/source/stable/jquery.layout.min.js',
    //'bower_components/jasmine/lib/jasmine-core.js',
    'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
    'bower_components/bootstrap/dist/js/bootstrap.min.js',
    'bower_components/bootstrap-select/dist/js/bootstrap-select.min.js',
    'bower_components/date.format/date.format.js',
    'bower_components/handsontable/dist/handsontable.full.min.js',
    'bower_components/highlight-js/src/highlight.js',
    //'bower_components/jsoneditor/dist/jsoneditor.min.js'
];
var mainLibs = [
    'src/main/webapp/js/jquery-ui-1.11.0.min.js',
    'src/main/webapp/js/jsonUtil.js',
    'src/main/webapp/js/constants.js',
    'src/main/webapp/js/jsdifflib.js',
    'src/main/webapp/js/jsdiffview.js',
    'src/main/webapp/js/mitDate.js',
    'src/main/webapp/js/loadCubeList.js',
    'src/main/webapp/js/heartBeat.js',
    'src/main/webapp/js/common.js',
    'src/main/webapp/js/index.js',
    'src/main/webapp/js/details.js',
    'src/main/webapp/js/ncube.js',
    'src/main/webapp/js/ncubeJsonEditor.js',
    'src/main/webapp/js/rpm.js',
    'src/main/webapp/js/test.js',
    'src/main/webapp/js/visualize.js'
];
var supportFiles = [
    'src/main/webapp/index.html',
    'src/main/webapp/html/*.html'
];
var specFiles = [
    'src/test/js/*-spec.js'
];
var files = [].concat(testStyles, thirdPartyLibs, mainLibs,
    supportFiles, specFiles);

module.exports = function(config) {
    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: '',

        // frameworks to use
        frameworks: ['jasmine'],

        files : files,

        // list of files to exclude
        exclude: [],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,
        logColors: true,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        browsers: ['PhantomJS'],

        proxies: {
            '/js/': '/base/src/main/webapp/js/'
        },

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,
        browserDisconnectTimeout : 10000,   // default 2000
        browserDisconnectTolerance : 1,     // default 0
        browserNoActivityTimeout : 60000,   //default 10000

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};