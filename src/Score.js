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