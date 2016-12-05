module.exports = function(grunt) {
    "use strict";
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    var jsFiles = [
        'src/js/main.js'
    ];

    // configure the tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		
	    less: {
			options: {
				compile: true,
				compress: true
			},
			'public/css/global.min.css': 'src/less/main.less'
	    },

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: jsFiles,
                dest: 'public/js/main.min.js'
            }
        },

        uglify: {
            dist: {
                files: {
                    '<%=concat.dist.dest %>': ['<%=concat.dist.dest %>']
                },
                options: {
                    compress: {
                        sequences: true,
                        drop_console: true,
                        dead_code: true,
                        unused: true,
                        join_vars: true,
                        unsafe: true
                    }
                }
            }
        },

        watch: {
            js: {
                files: jsFiles,
                tasks: ['js']
            },
            less: {
                files: ['src/less/**/*.less'],
                tasks: ['less']
            }
        }
    });

    grunt.registerTask('default',   ['build', 'watch']);
    grunt.registerTask('css', ['less']);
    grunt.registerTask('js', ['concat', 'uglify']);
    grunt.registerTask('build', ['css', 'js']);
};