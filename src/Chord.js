Parti.Chord = function() {

	var self = this;

	var duration = 1;

	var notes = [];

	this.name = 'chord';

	this.addNote = function(note) {
		notes.push(note);
		return self;
	}

	//Function to sort notes order to avoid warnings on vexflow
	function sortNotes() {
		if(notes.length < 2)
			return;

		//Sort keys
		notes.sort(function(note1, note2) {
			var octave1 = note1.octave;
			var octave2 = note2.octave;

			if(octave1 == octave2) {
				var note1Code = note1.note.charCodeAt(0);
				note1Code = note1Code < 67 ? note1Code + 7 : note1Code;

				var note2Code = note2.note.charCodeAt(0);
				note2Code = note2Code < 67 ? note2Code + 7 : note2Code;

				return note1Code - note2Code;
			}

			return octave1 - octave2;
		});
	}

	this.setDuration = function(durationValue) {
		duration = durationValue;
		return self;
	}

	this.getDuration = function() {
		return duration;
	}

	this.foreach = function(callback) {
		//Sort notes first to avoid warning
		sortNotes();		

		for (var i = 0; i < notes.length; i++) {
			callback.call(this, notes[i], i == 0, i == notes.length - 1);		
		}
	}
}