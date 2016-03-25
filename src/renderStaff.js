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