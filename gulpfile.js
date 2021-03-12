const { src, dest, watch, parallel, series } = require('gulp');
const scss = require('gulp-sass');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const clean_css = require('gulp-clean-css');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const del = require('del');
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

function browsersync(){
    browserSync.init({
        server : {
            baseDir: 'dist/'
        }
    });
}

function cleanDist(){
    return del('dist')
}

function html(){
    return src('app/*.html')
    .pipe(dest('dist/'))
    .pipe(browserSync.stream())
}

function styles(){
    return src('app/scss/style.scss')
        .pipe(scss({outputStyle: 'expanded'}))//expanded без минифицирования
        .pipe(autoprefixer({
            overrideBrowserslist:['last 2 version'],
            grid: true
        }))
        .pipe(dest('dist/css'))
        .pipe(clean_css())
        .pipe(rename({
            extname:'.min.css'
          }))
        .pipe(dest('dist/css'))
        .pipe(browserSync.stream())
}

function scripts(){
    return src('app/js/main.js')
    .pipe(dest('dist/js'))
    .pipe(uglify())
    .pipe(rename({
        extname:'.min.js'
      }))
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream())
}

function images(){
    return src('app/img/**/*.{jpg,png,gif,ico,webp}')
    .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.mozjpeg({quality: 75, progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo({
            plugins: [
                {removeViewBox: true},
                {cleanupIDs: false}
            ]
        })
    ]))
    .pipe(dest('dist/img'))
}

function svgsprite(){
    return src('app/img/**/*.svg')
    .pipe(svgmin({
        js2svg: {
            pretty: true
        }
    }))
    .pipe(cheerio({
        run: function ($) {
            $('[fill]').removeAttr('fill');
            $('[stroke]').removeAttr('stroke');
            $('[style]').removeAttr('style');
        },
        parserOptions: {xmlMode: true}
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
        mode: {
            symbol: {sprite: "../sprite.svg"}
        }
    }))
    
    .pipe(dest('dist/img/sprite/'));
}

function watching(){
    watch(['app/*.html'], html);
    watch(['app/scss/**/*.scss'], styles);
    watch(['app/js/**/*.js'], scripts);
    watch(['app/img/**/*.{jpg,png,gif,ico,webp}'], images);
    watch(['app/img/**/*.svg'], svgsprite);
}

let build = series(cleanDist, images, styles, html, scripts,svgsprite);
exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;
exports.svgsprite = svgsprite;
exports.build = build;
exports.default = parallel(build, watching, browsersync);