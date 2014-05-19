function Instrument () {
	this.name       = "";
	this.type       = 0;
	this.numSamples = 0;
	
	this.sampleKeyMap    = [];
	this.samples         = [];
	this.volumeEnvelope  = new Envelope ();
	this.panningEnvelope = new Envelope ();
	
	for (var i = 0; i < 96; i ++) {
		this.sampleKeyMap.push (0);
	}
	
	/**
	 * Get the sample that is registered in the keymap at the given note index.
	 */
	this.getSample = function (note) {
		this.sampleKeyMap[note];
	}
	
	
	this.getPanningEnvelope = function () {
		return this.panningEnvelope;
	}
	
	
	this.getVolumeEnvelope = function () {
		return this.volumeEnvelope;
	}
	
	
	/**
	 * Assign a given sample to a given note index.
	 */
	this.assignSampleKey = function (note, sample) {
		this.sampleKeyMap[note] = sample;
	}
	
	
	/**
	 * Set the panning envelope used by samples of this instrument.
	 */
	this.setPanningEnvelope = function (envelope) {
		this.panningEnvelope = envelope;
	}
	
	
	/**
	 * Set the volume envelope used by samples of this instrument.
	 */
	this.setVolumeEnvelope = function (envelope) {
		this.volumeEnvelope = envelope;
	}
	
	this.dumpMap = function () {
		return sampleKeyMap;
	}
}