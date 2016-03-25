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