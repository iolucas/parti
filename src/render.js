function renderScore(mJson) {

	console.log(mJson);

	var score = new Parti.Score();

	foreach(mJson.parts, function(part) {

		var staff = new Parti.Staff();
		score.addStaff(staff);

		var staffNoteDivisions = 1;

		foreach(part.measures, function(measure) {

			var fileMeasure = new Parti.Measure();
			staff.addMeasure(fileMeasure);

			var lastChord = null;	//Last chord ref to handle notes

			foreach(measure.members, function(member) {

				if(member.name == 'attributes') {

					//Set the note divisions
					if(member.hasOwnProperty('divisions')) {
						staffNoteDivisions = parseInt(member.divisions);
					}

					//If there is a clef on the attribute
					if(member.hasOwnProperty('clef')) {
						fileMeasure.addMember(new Parti.Clef(
							getClefName(member.clef.sign + member.clef.line)));
					}

					if(member.hasOwnProperty('key')) {
						fileMeasure.addMember(new Parti.Key(getKeyName(member.key)));
					}

					if(member.hasOwnProperty('time')) {
						var timeSig = member.time['beat-type'] + '/' + member.time['beats'];
						fileMeasure.setTimeSignature(timeSig);
					}

					//Clear last chord reference in case some attribute showup
					lastChord = null;

				} else if(member.name == 'note') {

					var fileChord = new Parti.Chord();
					fileMeasure.addMember(fileChord);

					//var chordDuration = getDurationName(4 * staffNoteDivisions / parseInt(member.duration));
					var chordDuration = getDurationName(member.duration);

					fileChord.setDuration(chordDuration);

					foreach(member.keys, function(key) {
						//If the key is not a rest
						if(!key.isRest) {
							var noteObj = { 
								note: key.pitch.step, 
								octave: key.pitch.octave 
							}

							if(key.accidental)
								noteObj.accidental = key.accidental;

							fileChord.addNote(noteObj);
						}
					});

				}

			});

		});

	});

	score.render();
}


function renderScore2(mJson) {

	console.log(mJson);
	var canvas = $("canvas")[0];
	var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
	var ctx = renderer.getContext();
	

	foreach(mJson.parts, function(part) {
		renderStaff(ctx, part);
	});


}



function foreach(array, callback) {
	for (var i = 0; i < array.length; i++) {
		callback.call(this, array[i], i == 0, i == array.length - 1);
	}
}

function getClefName(clefString) {
	switch(clefString) {
		case 'G2':
			return 'treble';

		case 'F4':
			return 'bass';

		case 'C3':
			return 'alto';
	}
}

function getKeyName(keyVal) {

	switch(keyVal) {

		case '-7':
			return 'Cb';

		case '-6':
			return 'Gb';

		case '-5':
			return 'Db';

		case '-4':
			return 'Ab';

		case '-3':
			return 'Eb';

		case '-2':
			return 'Bb';

		case '-1':
			return 'F';

		case '1':
			return 'G';

		case '2':
			return 'D';

		case '3':
			return 'A';

		case '4':
			return 'E';

		case '5':
			return 'B';

		case '6':
			return 'F#';

		case '7':
			return 'C#';
	}	
}

function getDurationName(durationValue) {

	switch(durationValue) {

		case 1:
			return 'w';

		case 2:
			return 'h';

		case 4:
			return 'q';

//----------------------------------------

		//Not implemented on vexflow
		//case 'maxima':
		//case 'long':
		//case 'breve'

		case 'whole':
			return 'w';

		case 'half':
			return 'h';

		case 'quarter':
			return 'q';

		case 'eighth':
			return '8';

		case '16th':
			return '16';

		case '32nd':
			return '32';

		case '64th':
			return '64';

		case '128th':
			return '128';

		//case '256th':
		//case '512th':
		//case '1024th':

		default:
			return durationValue.toString();
	}
}


