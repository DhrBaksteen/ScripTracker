/**
 * Pattern.js
 *
 * Pattern defines a generic ScripTracker pattern regardless of the module type. The various loaders should take care of
 * filling a pattern with correct data so that it is usable by ScripTracker.
 *
 * Author:  		Maarten Janssen
 * Date:    		2013-02-14
 * Last updated:	2014-05-19
 */
function Pattern (rows, columns) {
	this.patternIndex = 0;              // Index of this pattern within the module.

	this.rows    = rows;				// Number of rows in this pattern.
	this.columns = columns;				// Number of channels in this pattern.
	
	this.note        = [];				// Array of notes for each row and each channel
	this.instrument  = [];				// Array of instrument indexes for each row and each channel
	this.volume      = [];				// Array of volume settings for each row and each channel
	this.effect      = [];				// Array of effect indexes for each row and each channel
	this.effectParam = [];				// Array of effect parameters for each row and each channel
	
	// Initialize empty pattern.
	for (var i = 0; i < rows; i ++) {
			this.note[i]        = [];
			this.instrument[i]  = [];
			this.volume[i]      = [];
			this.effect[i]      = [];
			this.effectParam[i] = [];
		for (var j = 0; j < columns; j ++) {
			this.note[i][j]        = 0;
			this.instrument[i][j]  = 0;
			this.volume[i][j]      = -1;
			this.effect[i][j]      = Effects.NONE;
			this.effectParam[i][j] = 0;
		}
	}

	var noteNames = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
	var hexValues = "0123456789ABCDEF";


	/**
	 * Export the data of the given row and channel to text. If the provided index is out of bounds an empty channel row
	 * is returned.
	 *
	 * row     - Index of row to export
	 * channel - Index of channel to export
	 */
	this.toText = function (row, channel, modType) {
		var text = "";

		// Return an empty row if row or column index out of bounds.
		if (row < 0 || row >= this.rows || channel < 0 || channel >= this.columns) {
			return "... .. .. ...";
		}

		// Write note name
		if (this.note[row][channel] == 0) {
			text += "...";
		} else if (this.note[row][channel] == 97) {
			text += "===";
		} else {
			text += noteNames[(this.note[row][channel] - 1) % 12];
			text += Math.floor ((this.note[row][channel] - 1) / 12);
		}

		// Write instrument
		text += " ";
		if (this.instrument[row][channel] != 0) {
			text += hexValues.charAt (Math.floor (this.instrument[row][channel] / 16));
			text += hexValues.charAt (this.instrument[row][channel] % 16);
		} else {
			text += "..";
		}

		// Write volume data
		text += " ";
		if (this.volume[row][channel] > -1 && this.instrument[row][channel] != 0) {
			var vol = this.volume[row][channel] * 64;
            text += hexValues.charAt (Math.floor (vol / 16));
			text += hexValues.charAt (vol % 16);
		} else {
			text += "..";
		}

		// Write effect data
		text += " ";
		
		if (this.effect[row][channel] != Effects.NONE) {
			text += this.effect[row][channel].representations[modType];
			if (text.length == 11) {
               	text += hexValues.charAt (Math.floor (this.effectParam[row][channel] / 16));
			}
			text += hexValues.charAt (this.effectParam[row][channel] % 16);
		} else {
			text += "...";
		}

		return text;
	};
}