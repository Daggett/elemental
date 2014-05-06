'use strict';

var path = require('path');

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        clean: {
            dist: {
                src: ['dist/**/*']
            }
        },
        copy: {
            dist: {
                cwd: 'src/',
                src: '**/*.js',
                dest: 'dist/',
                expand: true,
                files: [
                    '**/*.js'
                ]
            }
        },
        concat: {
            distJs: {
                src: [
                    'dist/**/*.js',
                    '!dist/*.min.js'
                ],
                dest: 'dist/elemental.js',
            },
            distCss: {
                src: [
                    'dist/**/*.css',
                    '!dist/*.min.css'
                ],
                dest: 'dist/elemental.css'
            }
        },
        uglify: {
            options: {
                report: 'gzip',
                sourceMap: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'dist',
                    src: '{,*/}*.js',
                    dest: 'dist',
                    ext: '.min.js'
                }]
            }
        },
        sass: {
            options: {
                compass: true
            },
            dist: {
                files: [{
                    sourcemap: true,
                    expand: true,
                    cwd: 'src',
                    src: ['**/*.scss'],
                    dest: 'dist/',
                    ext: '.css'
                }]
            }
        },
        watch: {
            sass: {
                files: ['src/**/*.scss'],
                tasks: ['sass:dist']
            },
            serve: {
                options: {
                    livereload: true
                },
                files: [
                    'dist/**/*.css',
                    'src/**/*.js'
                ]
            },
            grunt: {
                files: [ 
                    'Gruntfile.js'
                ], 
                options: {
                    reload: true
                }
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            serve: {
                tasks: ['watch:sass', 'watch:serve', 'watch:grunt']
            }
        },
        connect: {
            serve: {
                options: {
                    host: '*',
                    port: 9000,
                    livereload: true,
                    base: ['dist', 'src']
                }
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'copy:dist',
        'concat:distJs',
        'uglify:dist',
        'sass:dist',
        'concat:distCss'
    ]);

    grunt.registerTask('serve', [
        'clean:dist',
        'sass:dist',
        'connect:serve',
        'concurrent:serve'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);
};
