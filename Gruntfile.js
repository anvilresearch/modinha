module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cov');
  grunt.loadNpmTasks('grunt-release');

  grunt.initConfig({
    watch: {
      test: {
        files: [
          'lib/**/*.js',
          //'test/**/*.js',
          'test/**/*.coffee'
        ],
        tasks: ['mochacov']
      }
    },
    mochacov: {
      options: {
        reporter: 'spec',
        compilers: ['coffee:coffee-script']
      },
      all: [
        'test/**/*.coffee'
      ]
    }
  });

  grunt.registerTask('test', ['mochacov', 'watch:test']);
  
};