'use strict';

var gulp = require('gulp'),
    mainBowerFiles = require('main-bower-files'),
    rimraf = require('rimraf'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    app = require('./src/app/gulp.js'),
    controller = require('./src/controller/gulp.js'),
    merge = require('merge-stream'),
    filter = require('gulp-filter');

function getDeployAddr(callback) {
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
        callback('http://'+add+':9000');
    });
}

gulp.task('build', function(){
    rimraf('build', function() {
        getDeployAddr(function(addr) {
            console.log('addr: ' + addr);

            app.build('src/app', 'build', '/', addr);
            controller.build('src/controller', 'build', '/controller/', addr);

            //--- images
            gulp.src(mainBowerFiles().concat(["src/**/*.png", "src/**/*.jpg"]))
                .pipe(filter(["src/**/*.png", "src/**/*.jpg"]))
                .pipe(imagemin({
                    progressive: true,
                    svgoPlugins: [{removeViewBox: false}],
                    use: [pngquant()],
                    interlaced: true
                }))
                .pipe(gulp.dest('build/content/img'));

            //--- fonts
            gulp.src("src/**/*.tff")
                .pipe(gulp.dest('build/content/fonts'));
        });
    });
});

gulp.task('default', ['build']);