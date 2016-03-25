module.exports = function(grunt) {

	// Project configuration. 
	grunt.initConfig({
  		concat: {
    		dist: {
      		src: [
            'src/Parti.js',
            'src/Score.js',
            'src/Staff.js',
            'src/Measure.js',
            'src/Chord.js',
            'src/Clef.js',
            'src/Key.js',
            'src/Time.js',

            'src/render.js',
            'src/renderStaff.js',
            'src/renderMeasure.js',

            'src/renderExample.js'

          ], //select all javascript files of the src folder

      		dest: 'releases/parti.js', //target to the concatened files
    		},
  		},

      /*uglify: {
        options: {
          compress: {
            drop_console: true
          }
        },
        my_target: {
          files: {
            'releases/parti.min.js': ['releases/parti.js']
          }
        }
      },*/
      //Every time some js file change, concatenate them to the release version
      watch: {
        scripts: {
          files: 'src/*.js',
          tasks: ['concat']
        },
      }
	});

	grunt.loadNpmTasks('grunt-contrib-concat');	//load concat module

  //grunt.loadNpmTasks('grunt-contrib-uglify'); //load minification module

  grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat', 'watch']);	//execute concat function on grunt call
}