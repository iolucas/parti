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

