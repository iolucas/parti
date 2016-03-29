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

	var _timeSignature;
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