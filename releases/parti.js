//Main object declaration

var Parti = {}
Parti.Score = function() {

	var staffs = [];

	console.log(new Vex.Flow.Formatter());
	console.log([Vex.Flow.Formatter]);

	this.addStaff = function(staff) {
		staffs.push(staff);
	}

	function getChordsLength(chords) {

		// Start by creating a voice and adding all the notes to it.
    	var voice = new Vex.Flow.Voice(Vex.Flow.TIME4_4)
      		.setMode(Vex.Flow.Voice.Mode.SOFT);
    
    	voice.addTickables(chords);

    	var formater = new Vex.Flow.Formatter();
    	return formater.preCalculateMinTotalWidth([voice]);
	}

	this.render = function() {

		var scoreLines = [];
		var scoreLinesIndex = -1;	//Start index with -1 to initiate it correcly


		//Iterate thru staffs and measures and populate score lines array
		for (var i = 0; i < staffs.length; i++) {

			var staffData = staffs[i];

			var currentClef = null;

			staffData.foreach(function(measureData, firstMeasure, lastMeasure, measureIndex) {

				var measureMembers = [];

				measureData.foreach(function(memberData, firstMember, lastMember) {

					if(memberData.name == 'chord') {

						if(currentClef == null)
							throw 'Invalid Chord: No clef has been set to the staff yet';

						var chordKeys = [];
						var chordDuration = memberData.getDuration();

						memberData.foreach(function(noteData) {
							chordKeys.push(noteData.note + "/" + noteData.octave);
						});

						measureMembers.push(new Vex.Flow.StaveNote({ 
							clef: currentClef,
							keys: chordKeys, 
							duration: getDurationName(chordDuration),
							auto_stem: true
						}));

					} else if(memberData.name == 'clef') {
						currentClef = memberData.getClef();
					} 


				});

				var chordsLength = getChordsLength(measureMembers);

				//Check if the scoreLine array has been initiated, 
				//if its length is not overflowed and 
				//if its width is not overflowed

				if(scoreLinesIndex > -1 && 
					scoreLines[scoreLinesIndex].measures.length < 4 &&
					scoreLines[scoreLinesIndex].width + chordsLength < 1000) {

					scoreLines[scoreLinesIndex].measures.push(measureData);
					scoreLines[scoreLinesIndex].width += chordsLength;

				} else {
					//If not, increase score lines index, and add the current measuredata to it

					scoreLinesIndex++;
					scoreLines[scoreLinesIndex] = {
						measures: [measureData],
						width: chordsLength
					}

				}

					

			});
		}

		//Now we have the lines, we render them correctly

		var canvas = $("canvas")[0];
		var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
		var context = renderer.getContext();

		var renderObjectsQueue = [];

		var renderWindowWidth = 1400;

		var measureVerticalPosPointer = 180;

		currentClef = null;	//reset the current clef
		var currentTime;
		var currentKey;

		var prevMeasure = null;
		var prevMeasureData = null;

		for (var i = 0; i < scoreLines.length; i++) {
			var scoreLine = scoreLines[i];

			for (var j = 0; j < scoreLine.measures.length; j++) {
				var measureData = scoreLine.measures[j];
				
				//Later we must add weights according to the line minimal space
				var measureWidth = renderWindowWidth / scoreLine.measures.length;

				var measureMembers = [];

				var measure = new Vex.Flow.Stave(j * (measureWidth + 10) + 20, 
					measureVerticalPosPointer, measureWidth)
					.setContext(context);

				//Place begin repeat bar if some or place a repeat both bar in the previous if needed

				if(measureData.getStartBar() == 'repeat_begin') {

					//If first measure of the line
					if(j == 0) {
						//Place the repeat begin bar
						measure.setBegBarType(getBarType('repeat_begin'));
					} else { //If not, 

						//Check if the prev measure
						if(prevMeasureData.getEndBar() == "repeat_end") {
							prevMeasure.setEndBarType(getBarType("repeat_both"));
							measure.setBegBarType(getBarType('none'));
						} else {
							prevMeasure.setEndBarType(getBarType("repeat_begin"));
							measure.setBegBarType(getBarType('none'));
						}
					}

				} else {
					measure.setBegBarType(getBarType('none'));
				}

				//Place end bar if there is some
				var endBar = measureData.getEndBar();
				if(endBar != 'none') {
					measure.setEndBarType(getBarType(endBar));
				}

				//Place the time signature
				var measureTimeSig = measureData.getTimeSignature();
				if(measureTimeSig != currentTime) {

					currentTime = measureTimeSig;

					if(j == 0)
						measure.setTimeSignature(currentTime);

					if(prevMeasure)
						prevMeasure.setEndTimeSignature(currentTime);							
				}

				//Place clef in case first measure and clef already signed
				if(j == 0 && currentClef) //first measure of the line
					measure.setClef(currentClef);

				//Place the current key signature if there is some
				if(j == 0 && currentClef && currentKey)
					//Set the current key signature of the measure
					measure.setKeySignature(currentKey, undefined, undefined, currentClef);

				//Flag to signalize whether a note has already been placed in the measure
				var notePlacedFlag = false;

				measureData.foreach(function(memberData, firstMember, lastMember) {

					if(memberData.name == 'chord') {

						notePlacedFlag = true;

						var chordKeys = [];
						var chordDuration = memberData.getDuration();

						memberData.foreach(function(noteData) {
							chordKeys.push(noteData.note + "/" + noteData.octave);
						});

						measureMembers.push(new Vex.Flow.StaveNote({ 
							clef: currentClef,
							keys: chordKeys, 
							duration: getDurationName(chordDuration),
							auto_stem: true
						}));

					} else if(memberData.name == 'clef') {

						var measureClef = memberData.getClef();
						if(measureClef != currentClef) {
							currentClef = measureClef;

							if(notePlacedFlag) {
								//Verification to avoid overlapping of the clef symbol into the bars in case last clef
								if(lastMember || false) {
									measure.setEndClef(currentClef, 'small');
								} else {
									measureMembers.push(new Vex.Flow.ClefNote(currentClef, 'small'));
								}
							} else { //If notes were not placed yet

								if(j == 0) //first measure of the line
									measure.setClef(currentClef);

								if(prevMeasure)
									prevMeasure.setEndClef(currentClef, 'small');
							}
						}

					} else if(memberData.name == 'key') {
						
						if(currentClef == undefined)
							throw 'Key Signature Error: No clef has been set yet.';

						//Place the measure key signature
						var measureKeySig = memberData.getKey();
						if(measureKeySig != currentKey) {
					
							currentKey = measureKeySig;

							//If it is there first line, set the key signature
							if(j == 0)
								measure.setKeySignature(currentKey, undefined, undefined, currentClef);

							//Set the prev measure the current signature
							if(prevMeasure)
								prevMeasure.setEndKeySignature(currentKey, undefined, currentClef);									
						}

					} 
				});

				//Get the current member ref into the prev member var
				prevMeasure = measure;
				prevMeasureData = measureData;

				//Add objects to the render queue to be processed later

				renderObjectsQueue.push({
					type: 'measure',
					measure: measure
				});

				renderObjectsQueue.push({
					type: 'format',
					context: context,
					measure: measure,
					measureMembers: measureMembers
				});


			}

			measureVerticalPosPointer += 100;
		}

		//Now everything is prepared we may render it

		for (var i = 0; i < renderObjectsQueue.length; i++) {
			switch(renderObjectsQueue[i].type){

				//Draw measure
				case 'measure':
					renderObjectsQueue[i].measure.draw();
					break;

				//Format and position measure members
				case 'format':
					Vex.Flow.Formatter.FormatAndDraw(renderObjectsQueue[i].context, 
						renderObjectsQueue[i].measure, 
						renderObjectsQueue[i].measureMembers);	
					break;
			}
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

			default:
				return durationValue.toString();
		}
	}

	function getBarType(bar) {

		var barObj = Vex.Flow.Barline.type;

		switch(bar) {

			case 'single':
				return barObj.SINGLE;

			case 'double':
				return barObj.DOUBLE;

			case 'end':
				return barObj.END;

			case 'repeat_begin':
				return barObj.REPEAT_BEGIN;

			case 'repeat_end':
				return barObj.REPEAT_END;

			case 'repeat_both':
				return barObj.REPEAT_BOTH;

			case 'none':
				return barObj.NONE;

			default:
				return barObj.NONE;
		}
	}
}
//Staff class

//How it works
//We must add all the measures, and them, when we render, it will iterate thru the measures and populate the staff members array
//All validation stuff will be made here, cause it may depend on other measures

Parti.Staff = function() {

	var measures = [];

	this.addMeasure = function(measure) {
		measures.push(measure);
	}

	this.count = function() {
		return measures.length;
	}

	this.foreach = function(callback) {

		for (var i = 0; i < measures.length; i++) {
			callback.call(this, measures[i], i == 0, i == measures.length - 1, i);
		}
	}
}
//Measure class

//How it works
//this will have things like, start bar, end bar, time sig and inner components (such notes, clefs, and key sigs)

Parti.Measure = function() {

	var self = this;

	var members = [];	//Members to be place into the measure (notes, clefs, timesigs, key sigs etc)

	this.addMember = function(member) {
		members.push(member);
		return self;
	}

	var _timeSignature = '4/4';
	this.setTimeSignature = function(timeSig) {
		_timeSignature = timeSig;
		return self;			
	}
	this.getTimeSignature = function() { return _timeSignature; }
	

	var _keySignature = 'C';
	this.setKeySignature = function(keySig) {
		_keySignature = keySig;
		return self;			
	}
	this.getKeySignature = function() { return _keySignature; }


	var _startBar = 'none';
	this.setStartBar = function(barValue) { 
		_startBar = barValue; 
		return self;
	}
	this.getStartBar = function() { return _startBar; }

	var _endBar = 'single';
	this.setEndBar = function(barValue) { 
		_endBar = barValue; 
		return self;
	}
	this.getEndBar = function() { return _endBar; }

	this.foreach = function(callback) {

		for (var i = 0; i < members.length; i++) {
			callback.call(this, members[i], i == 0, i == members.length - 1);
		}
	}
}
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
Parti.Clef = function(clefName) {
	
	var clef = clefName;

	this.name = 'clef';

	this.getClef = function() {
		return clef;
	}
}
Parti.Key = function(keyName) {
	
	var key = keyName;

	this.name = 'key';

	this.getKey = function() {
		return key;
	}

	/*function getKeyName(keyVal) {

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
	}*/
}
Parti.Time = function(timeValue) {
	
	var timeVal = timeValue;

	this.name = 'time';

	this.getTime = function() {
		return timeVal;
	}
}
console.log('Fix bug in case time signature product odd durations values');
console.log('Fix bug that stem do not extend to the middle of the score lines');
console.log('create proper project to store this');


function renderScore2(mJson) {


	var newScore = new Parti.Score();

	foreach(mJson.parts, function(part) {

		newScore.AddStaff(part);

	});

	newScore.Render();




	/*console.log(mJson);

	var score = new Parti.Score();

	foreach(mJson.parts, function(part) {

		var staff = new Parti.Staff();

		foreach(part.measures, function(measure) {

			var fileMeasure = new Parti.Measure();

			foreach(measure.members, function(member) {

				if(member.name == 'note') {


				}

			});

		});

		score.AddStaff(staff);
		score.Render();
	});*/

}


function renderScore(mJson) {

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


//Function to render the staff in the passed context

function renderStaff(context, partData) {

		var staff = new Vex.Flow.Stave(10, 200, 1450)
			.setContext(context);

		var staffNoteDivisions = 1;
		var staffMembers = [];

		foreach(partData.measures, function(measure, isFirst, isLast) {

			var currentClef = 'treble';

			foreach(measure.members, function(member) {

				if(member.name == 'attributes') {
					
					if(isFirst)	{

						if(member.divisions != undefined)
							staffNoteDivisions = parseInt(member.divisions);
						
						if(member.time != undefined)
							staff.setTimeSignature(member.time['beats'] + '/' + member.time['beat-type']);
						
						if(member.clef != undefined) {
							var clefName = getClefName(member.clef.sign + member.clef.line);
							currentClef = clefName;
							staff.setClef(clefName);
						}
						
						if(member.key != undefined && member.key != 0)
							staff.setKeySignature(getKeyName(member.key));

					} else {

						if(member.clef != undefined) {
							
							var clefName = getClefName(member.clef.sign + member.clef.line);
							currentClef = clefName;
							staffMembers.push(new Vex.Flow.ClefNote(clefName, 'small'));
						}
					}

				} if(member.name == 'note') {

					var noteDuration = getDurationName(1) + 'r';
					var noteKeys = [];

					foreach(member.keys, function(key) {

						noteDuration = getDurationName(4 * staffNoteDivisions / parseInt(key.duration));

						if(key.isRest) {
							noteKeys.push('b/4');
							noteDuration += 'r';

						} else {
							noteKeys.push(key.pitch.step + "/" + key.pitch.octave);	
						}								
					});

					staffMembers.push(new Vex.Flow.StaveNote({ 
						clef: currentClef,
						keys: noteKeys, 
						duration: noteDuration,
						auto_stem: true
					}));
				}

			});

			if(!isLast)
				staffMembers.push(new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.SINGLE));
		});

		//Draw stave
		staff.draw();

		// Helper function to justify and draw a 4/4 voice
  		Vex.Flow.Formatter.FormatAndDraw(context, staff, staffMembers);






}
//Function to render the score measures
function renderMeasure(measure, staff) {


	//create object to wrap vexflow components and improve the objectification of the score,
	//creating measures etc


}
function renderExample() {

	//write in a way that each measure is a stave object
	//verify how each line will be spaced, for now, create a fixed space between them
	console.log('KEYSIGNATURE');
	console.log(new Vex.Flow.KeySignature('Cb'));

	var chordExample = new Parti.Chord();
	chordExample
		.setDuration('2')
		.addNote({ note: 'G', octave: '4' })
		.addNote({ note: 'B', octave: '4' })
		.addNote({ note: 'D', octave: '4' });

	var measureExample = new Parti.Measure();

	var clefExample = new Parti.Clef('treble');

	measureExample
		.setTimeSignature('4/4')
		.addMember(clefExample)
		.addMember(new Parti.Key('G'))
		.addMember(chordExample)
		.addMember(new Parti.Clef('bass'))
		.addMember(chordExample)
		.setStartBar('repeat_begin')
		.setEndBar('end');


	var measureExample2 = new Parti.Measure();
	measureExample2
		.addMember(new Parti.Clef('bass'))
		.addMember(new Parti.Key('Cb'))
		.setEndBar('end');
		



	var staffExample = new Parti.Staff();
	staffExample.addMeasure(measureExample);
	staffExample.addMeasure(measureExample2);
	staffExample.addMeasure(measureExample);




	var scoreExample = new Parti.Score();
	scoreExample.addStaff(staffExample);

	scoreExample.render();
}