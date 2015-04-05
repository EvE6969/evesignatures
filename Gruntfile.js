module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    release: {
      options: {
        bump: true,
        changelog: false,
        file: 'package.json',
        add: true,
        commit: true,
        tag: true,
        push: false,
        pushTags: false,
        npm: false,
        npmtag: false
      }
    }

  });


  grunt.loadNpmTasks('grunt-release');

};
