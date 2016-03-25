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