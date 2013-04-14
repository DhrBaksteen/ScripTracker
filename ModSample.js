function ModSample (sampleData) {
	if (sampleData.length != 30) Throw ("Incorrect sample data block");

	this.name = "";
	for (var i = 0; i < 22; i ++) {
	    this.name += sampleData.charAt (i);
	}
	
	this.dataLength   = (sampleData.charCodeAt (22) * 256 + sampleData.charCodeAt (23)) * 2;
	this.fineTune     = (sampleData.charCodeAt (24) & 0x0F)
	this.volume       = (Math.min (sampleData.charCodeAt (25), 64.0)) / 64.0;
	this.repeatOffset = (sampleData.charCodeAt (26) * 256 + sampleData.charCodeAt (27)) * 2;
	this.repeatLength = (sampleData.charCodeAt (28) * 256 + sampleData.charCodeAt (29)) * 2;
	this.isRepeat     = this.repeatLength > 1;

	this.sample = [];
	
	
	this.loadSample = function (sampleData) {
		this.sample = [];

		for (var i = 0; i < sampleData.length; i ++) {
			if (sampleData.charCodeAt (i) < 128) {
			    this.sample[i] = sampleData.charCodeAt (i) / 127.0;
			} else {
			    this.sample[i] = -((sampleData.charCodeAt (i) ^ 0xFF) + 1) / 128.0;
			}
		}
		
		this.sample[0] = 0;
		this.sample[1] = 0;
	}
}