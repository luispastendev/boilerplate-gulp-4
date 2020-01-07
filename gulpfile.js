var {gulp, src, dest, watch, series, parallel} = require('gulp');

// GENERAL OPTIONS
var package = require('./package.json');
var del = require('del');
var hash = require('gulp-hash-filename');
var rename = require('gulp-rename');
var header = require('gulp-header');
var bs = require('browser-sync');

// STYLES 
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var prefix = require('autoprefixer');
var minify = require('cssnano');
var svgmin = require('gulp-svgmin');

// SCRIPTS
var uglify = require('gulp-terser');

var configs  = {
    hash: true,
    clean: true, // BORRAR EL BUILD
	copy: true,
	svg: true,
}

var paths = {
    input: 'src/',
    output: 'build/',
    styles: {
        input: 'src/sass/**/*.{scss,sass}',
        output: 'build/css'
    },
    reload: './build/',
    copy: {
		input: 'src/copy/**/*',
		output: 'build/'
	},
	svgs: {
		input: 'src/svg/*.svg',
		output: 'build/svg/'
	},
	scripts: {
		input: 'src/js/*',
		output: 'build/js/'
	},
}

var banner = {
	main:
		'/*!' +
		' <%= package.name %> v<%= package.version %>' +
		' | (c) ' + new Date().getFullYear() + ' <%= package.author.name %>' +
		' | <%= package.license %> License' +
		' */\n'
};

var scripts = function(){
	return src(paths.scripts.input)
		.pipe(header(banner.main, {package: package}))
		.pipe(hashFile())
		.pipe(dest(paths.scripts.output))
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(dest(paths.scripts.output));
}

var styles = function(){
    return src(paths.styles.input)
        .pipe(sass({
            outputStyle: 'expanded',
            sourceComments: false
        }))
        .pipe(postcss([
			prefix({
				cascade: false,
				remove: true
			})
		]))
        .pipe(header(banner.main,{package: package}))
        .pipe(hashFile())
        .pipe(dest(paths.styles.output))
        .pipe(rename({suffix: '.min'}))
        .pipe(postcss([
			minify({
				discardComments: {
					removeAll: true
				}
			})
        ]))
		.pipe(dest(paths.styles.output));
}

var hashFile = function(){

    if(!configs.hash){
        return hash({"format": "{name}{ext}"});
    }

    return hash({"format": "{name}.{hash:8}{ext}"});
}

var cleanBuild = function(done) {
    if (!configs.clean) return done();
	del.sync([
		paths.output
    ]);
    return done();
}

var copyFiles = function (done) {
	if (!configs.copy) return done();
	return src(paths.copy.input)
		.pipe(dest(paths.copy.output));

};

var buildSVGs = function (done) {
	if (!configs.svg) return done();
	return src(paths.svgs.input)
		.pipe(svgmin())
		.pipe(dest(paths.svgs.output));

};

// SERVER SERVER SERVER SERVER SERVER SERVER SERVER SERVER SERVER SERVER

var startServer = function (done) {
	bs.init({
		server: {
			baseDir: paths.reload
		}
    });
	done();
};

var reloadBrowser = function (done) {
    bs.reload();
	done();
};

var watchSource = function (done) {
	watch(paths.input, series(exports.default, reloadBrowser));
	done();
};



exports.default = series(
	cleanBuild,
	parallel(
        styles,
		copyFiles,
		buildSVGs,
		scripts
	)
);

exports.watch = series(
	exports.default,
	startServer,
	watchSource
);

