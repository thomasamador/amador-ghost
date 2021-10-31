const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
var gulp = require('gulp');
var zip = require('gulp-zip');
var uglify = require('gulp-uglify');
var beeper = require('beeper');
var browsersync = require('browser-sync').create();



// postcss plugins
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var colorFunction = require('postcss-color-mod-function');
var cssnano = require('cssnano');
var easyimport = require('postcss-easy-import');



// start browsersync server
function serve (done) {
    browsersync.init({
        proxy: "localhost:2369",
        browser: "Firefox Developer Edition",
         reloadOnRestart: true

    });
    done();
}

// error handling
const handleError = (done) => {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

// handlebars processor
function hbs(done) {
    pump([
        src(['*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs']),
        browsersync.reload(),
    ], handleError(done));
    // **** Could I use 'browsersync.reload();' here? ****
}

// css processor 
function css(done) {
    var processors = [
        easyimport,
        colorFunction(),
        autoprefixer(),
        cssnano()
    ];

    pump([
        src('assets/css/*.css', {sourcemaps: true}),
        postcss(processors),
        dest('assets/built/', {sourcemaps: '.'}),
        
    ],handleError(done));
    browsersync.reload();
}

// javascript processor
function js(done) {
    pump([
        src('assets/js/*.js', {sourcemaps: true}),
        uglify(),
        dest('assets/built/', {sourcemaps: '.'}),
        
        
    ], handleError(done));
}

// theme zipper. run 'gulp zip' to generate 'themename.zip'
function zipper(done) {
    var targetDir = 'dist/';
    var themeName = require('./package.json').name;
    var filename = themeName + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**'
        ]),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
    
}

// watchers and build steps
const cssWatcher = () => watch('assets/css/**', css);
const hbsWatcher = () => watch(['*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs'], hbs);
const watcher = parallel(cssWatcher, hbsWatcher);
const build = series(css, js);
const dev = series(build, serve, watcher);

// exports
exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
