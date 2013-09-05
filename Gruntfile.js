module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cov');
  grunt.loadNpmTasks('grunt-release');

  grunt.initConfig({
    watch: {
      test: {
        files: [
          'lib/**/*.js',
          'test/**/*.js'
        ],
        tasks: ['mochacov']
      }
    },
    mochacov: {
      options: {
        reporter: 'spec'
      },
      all: [
        'test/**/*.js'
      ]
    }
  });

  grunt.registerTask('test', ['mochacov', 'watch:test']);
  
};