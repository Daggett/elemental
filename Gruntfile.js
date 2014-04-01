'use strict';

var path = require('path');

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        clean: {
            dist: {
                src: ['dist']
            }
        },
        copy: {
            dist: {
                cwd: '.',
                src: 'src/**/*.js',
                dest: 'dist/modules/',
                expand: true,
                flatten: true,
                files: [
                    '**/*.js'
                ]
            },
            dev: {
                cwd: '.',
                src: 'src/**/*.js',
                dest: 'dist/modules/',
                expand: true,
                flatten: true,
                files: [
                    '**/*.js'
                ]  
            }
        },
        concat: {
            dist: {
                src: [
                    'dist/modules/*.js',
                    '!dist/modules/*.min.js'
                ],
                dest: 'dist/elemental.js',
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
                    flatten: true,
                    cwd: 'src',
                    src: ['**/*.scss'],
                    dest: 'dist/modules/',
                    ext: '.css'
                }]
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'copy:dist',
        'concat:dist',
        'uglify:dist',
        'sass:dist'
    ]);

    grunt.registerTask('dev', [
        'copy:dev'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);
};
