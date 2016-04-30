var
    gulp = require('gulp'),
    mainBowerFiles = require('main-bower-files'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate'),
    replace = require('gulp-replace'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    filter = require('gulp-filter'),
    prefixer = require('gulp-autoprefixer'),
    cssmin = require('gulp-cssnano'),
    rigger = require('gulp-rigger'),
    merge = require('merge-stream'),
    order = require("gulp-order");

exports.build = function(srcPath, buildPath, destPath, addr) {
    return merge(

        //--- app.js
        gulp.src(mainBowerFiles({group: 'controller'})
                .concat(srcPath + "/../shared/**/*.js")
                .concat([srcPath + "/lib/**/*.js"])
                .concat([srcPath + "/app/**/*.js"])
        ).pipe(filter("**/*.js"))
            //.pipe(order([
            //    "*.js",
            //    "app.js"
            //]))
            .pipe(replace("<APP DEPLOY ADDR>", addr))
            .pipe(sourcemaps.init())
            .pipe(concat("app.js"))
            .pipe(ngAnnotate())
            //.pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(buildPath + destPath)),

        //--- index.html
        gulp.src(srcPath + "/*.html")
            .pipe(rigger())
            .pipe(replace("<!-- inject:js -->", '<script src="'+destPath+'app.js"></script>'))
            .pipe(replace("<!-- inject:css -->", '<link rel="stylesheet" href="'+destPath+'content.css">'))
            .pipe(gulp.dest(buildPath + destPath)),

        //--- content.css
        gulp.src(mainBowerFiles({group: 'controller'}).concat(srcPath + "/**/*.*"))
            .pipe(filter(['**/*.css', '**/*.scss']))
            .pipe(sourcemaps.init())
            .pipe(concat('content.css'))
            .pipe(sass())
            .pipe(prefixer())
            //.pipe(cssmin())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(buildPath + destPath))
    );
};