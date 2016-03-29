
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
						var chordDuration = getDurationName(memberData.getDuration());

						memberData.foreach(function(noteData) {
							chordKeys.push(noteData.note + "/" + noteData.octave);
						});

						var isRest = chordKeys.length == 0;

						measureMembers.push(new Vex.Flow.StaveNote({ 
							clef: currentClef,
							keys: isRest ? [getCenterString(currentClef)] : chordKeys, 
							duration: isRest ? chordDuration + 'r' : chordDuration,
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
				if(measureTimeSig && measureTimeSig != currentTime) {

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
					//TODO: Use the same data generated for the line to avoid process same thing twice
					if(memberData.name == 'chord') {

						notePlacedFlag = true;

						var chordKeys = [];
						var chordDuration = getDurationName(memberData.getDuration());

						//Queue to hold note accidents to be added at once
						var accidentalQueue = [];
						var accNoteIndex = 0;

						memberData.foreach(function(noteData) {
							chordKeys.push(noteData.note + "/" + noteData.octave);
							
							//Push the accidental to the queue if some
							if(noteData.accidental) {
								accidentalQueue.push({
									index: accNoteIndex,
									accidental: getAccidentalLetter(noteData.accidental.type),
									cautionary: noteData.accidental.cautionary
								});
							}

							accNoteIndex++;
						});

						var isRest = chordKeys.length == 0;

						var staveNote = new Vex.Flow.StaveNote({ 
							clef: currentClef,
							keys: isRest ? [getCenterString(currentClef)] : chordKeys, 
							duration: isRest ? chordDuration + 'r' : chordDuration,
							auto_stem: true
						});

						//Add the queued accidentals to the stave note
						for (var accIndex = 0; accIndex < accidentalQueue.length; accIndex++) {
							var acc = accidentalQueue[accIndex];

							var accObj = new Vex.Flow.Accidental(acc.accidental);

							if(acc.cautionary)
								accObj.setAsCautionary();

							staveNote.addAccidental(acc.index, accObj);
						}

						measureMembers.push(staveNote);

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

	//Function to get the 
	function getCenterString(clef) {

		var centerNote = 'b/4';

		switch(clef) {

    		case "treble":
				//centerNote = 'b/4';
				break;

    		case "bass":
				centerNote = 'd/3';
				break;

    		case "alto":
				centerNote = 'c/4';
				break;

    		case "tenor":
				centerNote = 'a/3';
				break;

    		case "percussion":
				//centerNote = 'b/4';
				break;

    		case "soprano":
				centerNote = 'g/4';
				break;

    		case "mezzo-soprano":
				centerNote = 'e/4';
				break;

    		case "baritone-c":
				centerNote = 'f/3';
				break;

    		case "baritone-f":
				centerNote = 'f/3';
				break;

    		case "subbass":
				centerNote = 'b/2';
				break;

    		case "french":
				centerNote = 'd/5';
				break;

    		//case "tab":
				//centerNote = 'b/4';
				//break;
		}

		return centerNote;
	}

	function getAccidentalLetter(acc) {
		switch(acc) {

			case 'sharp':
  				return "#";

  			case 'double-sharp':
 				return "##";

 			case 'sharp-sharp':
 				return "##";

 			case 'flat':
				return "b";

			case 'flat-flat':
				return "bb";

			case 'natural':
				return "n";


			//return "{"; {   // Left paren for cautionary accidentals

			//return "}"; {   // Right paren for cautionary accidentals

			/*case 'sharp':
				return "db";

			case 'sharp':
				return "d";

			case 'sharp':
				return "bbs";

			case 'sharp':
				return "++";

			case 'sharp':
				return "+";

			case 'sharp':
				return "+-";

			case 'sharp':
				return "++-";

			case 'sharp':
				return "bs";

			case 'sharp':
				return "bss";*/

			default:
				throw 'Accidental not implemented: ' + acc;
		}
	}
}