/*
 *	Created by Trevor Sears <trevorsears.main@gmail.com>.
 *	8:48 PM -- June 16th, 2019.
 *	Website: website-name
 */

const gulp =		require("gulp");
const sourcemaps =	require("gulp-sourcemaps");
const typescript =	require("gulp-typescript");
const browserify =	require("browserify");
const uglify =		require("gulp-uglify-es").default;
const source =		require('vinyl-source-stream');
const buffer =		require('vinyl-buffer');
const sass =		require("gulp-sass");
const cleanCSS =	require("gulp-clean-css");
const imagemin =	require("gulp-imagemin");
const htmlmin =		require("gulp-htmlmin");
const del =			require("del");

let paths = {
	
	distDir: "../dist/",
	
	nodeModules: {
		
		dir: "node_modules/",
		allFiles: "node_modules/**/*",
		symlink: "../dist/node_modules/"
		
	},
	
	typescript: {
		
		dir: "ts/",
		allFiles: "ts/**/*.ts",
		tsconfig: "ts/tsconfig.json"
		
	},
	
	javascript: {
		
		dir: "../dist/js/",
		allFiles: "../dist/js/**/*.js",
		entryPoint: "../dist/js/main.js",
		entryPointFileName: "main.js",
		bundleFile: "../dist/js/bundle.js"
		
	},
	
	styles: {
		
		css: {
			
			dir: "../dist/styles/",
			cssFiles: "../dist/styles/**/*.css",
			mapFiles: "../dist/styles/**/*.css.map",
			allFiles: "../dist/styles/**/*.css*"
			
		},
		
		scss: {
			
			dir: "styles/",
			allFiles: "styles/**/*.scss",
			cache: "styles/.sass-cache/"
			
		}
		
	},
	
	config: {
		
		srcDir: "config/",
		srcFiles: "config/**/*",
		distDir: "../dist/config/"
		
	},
	
	fonts: {
		
		srcDir: "fonts/",
		srcFiles: "fonts/**/*",
		distDir: "../dist/fonts/"
		
	},
	
	images: {
		
		srcDir: "img/",
		srcFiles: "img/**/*",
		distDir: "../dist/img/"
		
	},
	
	html: {
		
		srcDir: "./",
		srcFiles: "./*.html",
		distDir: "../dist/"
		
	}
	
};

let typescriptProject = typescript.createProject(paths.typescript.tsconfig);
let verbose = false;

// Gulp tasks.

	// The default Gulp task.
	gulp.task("default", defaultTask);
	
	// Cleans (deletes) all generated/compiled files.
	gulp.task("clean", clean);
	
	// Builds the entire project.
	gulp.task("build", build);
	
	// Cleans and builds the entire project.
	gulp.task("rebuild", rebuild);
	
	// Compile/build through the entire pipeline from TypeScript files to a browser-ready bundle.
	gulp.task("build-js", buildJavaScriptPipeline);
	
	// Compile/build all relevant stylesheets.
	gulp.task("build-styles", buildStylesPipeline);
	
	// Watch for changes to relevant files and compile-on-change.
	gulp.task("watch", watch);

// Overarching compile/build functions.

	function defaultTask(done) {
		
		return rebuild(done);
		
	}
	
	function clean(done) {
		
		return del([
			paths.distDir,
			paths.styles.scss.cache
		],{ force: true });
		
	}
	
	function build(done) {
		
		gulp.parallel(
			buildJavaScriptPipeline,
			buildStylesPipeline,
			miscOpsPipeline
		)(done);
		
	}
	
	function rebuild(done) {
		
		gulp.series(clean, build)(done);
		
	}
	
// JavaScript/TypeScript functions.
	
	function buildJavaScriptPipeline(done) {
		
		return gulp.series(
			symlinkNodeModules,
			compileTypeScript,
			browserifyJavaScript,
			gulp.parallel(
				cleanJavaScriptFiles,
				uglifyJavaScript
			)
		)(done);
		
	}

	function symlinkNodeModules(done) {
		
		return gulp.src(paths.nodeModules.dir)
			.pipe(gulp.symlink(paths.nodeModules.symlink));
		
	}
	
	function compileTypeScript(done) {
		
		return typescriptProject.src()
			.pipe(sourcemaps.init())
			.pipe(typescriptProject()).js
			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(paths.javascript.dir));
		
	}
	
	function browserifyJavaScript(done) {
		
		return browserify({
				transform: [["babelify", { "presets": ["@babel/preset-env"] }]],
				debug: true,
				entries: [paths.javascript.entryPointFileName],
				basedir: paths.javascript.dir
			}).bundle()
			.pipe(source("bundle.js"))
			.pipe(buffer())
			.pipe(gulp.dest(paths.javascript.dir));
		
	}
	
	function cleanJavaScriptFiles(done) {
		
		return del([
			paths.javascript.dir + "**",
			"!" + paths.javascript.dir,
			"!" + paths.javascript.bundleFile
		],{ force: true });
		
	}
	
	function uglifyJavaScript(done) {
		
		return gulp.src(paths.javascript.bundleFile)
			.pipe(uglify())
			.pipe(gulp.dest(paths.javascript.dir));
		
	}

// Stylesheet functions.
	
	function buildStylesPipeline(done){
		
		return gulp.series(
			compileSCSS,
			minifyCSS
		)(done);
		
	}
	
	function compileSCSS(done) {
		
		return gulp.src(paths.styles.scss.allFiles)
			.pipe(sourcemaps.init())
			.pipe(sass.sync().on("error", sass.logError))
			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(paths.styles.css.dir));
		
	}
	
	function minifyCSS(done) {
	
		return gulp.src(paths.styles.css.cssFiles)
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(cleanCSS())
			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(paths.styles.css.dir));
		
	}
	
// Various minification and copying functions.

	function miscOpsPipeline(done) {
		
		return gulp.parallel(
			minifyHTML,
			minifyImages,
			copyFontFiles,
			copyConfigFiles
		)(done);
		
	}

	function minifyImages(done) {
		
		return gulp.src(paths.images.srcFiles)
			.pipe(imagemin({ verbose }))
			.pipe(gulp.dest(paths.images.distDir));
		
	}
	
	function minifyHTML(done) {
	
		return gulp.src(paths.html.srcFiles)
			.pipe(htmlmin())
			.pipe(gulp.dest(paths.html.distDir));
	
	}

	function copyConfigFiles(done) {
	
		return gulp.src(paths.config.srcFiles)
			.pipe(gulp.dest(paths.config.distDir));
	
	}
	
	function copyFontFiles(done) {
		
		return gulp.src(paths.fonts.srcFiles)
			.pipe(gulp.dest(paths.fonts.distDir));
	
	}

// Watch functions.
	
	function watch(done) {
		
		gulp.parallel(watchTypeScript, watchSCSS)(done);
		
	}
	
	function watchTypeScript(done) {
		
		gulp.watch([paths.typescript.allFiles], buildJavaScriptPipeline);
		
	}
	
	function watchSCSS(done) {
		
		gulp.watch([paths.styles.scss.allFiles], buildStylesPipeline());
		
	}