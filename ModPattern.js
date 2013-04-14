function ModPattern (patternData) {
	this.numChannels = patternData.length / 256;
	
	this.sample  = [];
	this.period  = [];
	this.effect  = [];
	this.effectX = [];
	this.effectY = [];
	for (var j = 0; j < this.numChannels; j ++) {
	    this.sample[j]  = [];
		this.period[j]  = [];
		this.effect[j]  = [];
		this.effectX[j] = [];
		this.effectY[j] = [];
	}
	
	this.notes = {1712: "C-0", 1616: "C#0", 1524: "D-0", 1440: "D#0", 1356: "E-0", 1280: "F-0", 1208: "F#0", 1140: "G-0", 1076: "G#0", 1016: "A-0", 960: "A#0", 906: "B-0",
				   856: "C-1",  808: "C#1",  762: "D-1",  720: "D#1",  678: "E-1",  640: "F-1",  604: "F#1",  570: "G-1",  538: "G#1",  508: "A-1", 480: "A#1", 453: "B-1",
				   428: "C-2",  404: "C#2",  381: "D-2",  360: "D#2",  339: "E-2",  320: "F-2",  302: "F#2",  285: "G-2",  269: "G#2",  254: "A-2", 240: "A#2", 226: "B-2",
				   214: "C-3",  202: "C#3",  190: "D-3",  180: "D#3",  170: "E-3",  160: "F-3",  151: "F#3",  143: "G-3",  135: "G#3",  127: "A-3", 120: "A#3", 113: "B-3",
				   107: "C-4",  101: "C#4",   95: "D-4",   90: "D#4",   85: "E-4",   80: "F-4",   76: "F#4",   71: "G-4",   67: "G#4",   64: "A-4",  60: "A#4",  57: "B-4",
				     0: "..."};
	
	for (var i = 0; i < 64; i ++) {
	    for (var j = 0; j < this.numChannels; j ++) {
	        var offset = i * this.numChannels * 4 + j * 4;
			var byte1 = patternData.charCodeAt (offset);
			var byte2 = patternData.charCodeAt (offset + 1);
			var byte3 = patternData.charCodeAt (offset + 2);
			var byte4 = patternData.charCodeAt (offset + 3);
			
			this.sample[j][i]  = (byte1 & 0xF0) | ((byte3 & 0xF0) / 16);
			this.period[j][i]  = ((byte1 & 0x0F) * 256) | byte2;
			this.effect[j][i]  = byte3 & 0x0F;
			this.effectX[j][i] = (byte4 & 0xF0) / 16;
			this.effectY[j][i] = byte4 & 0x0F;
		}
	}
	
	
	this.toSt3Row = function (line) {
		var hex = "0123456789ABCDEF";
	    var row = $("<tr class=\"trPatRow\"></tr>");

		var divisionCell = $("<td></td>");
        divisionCell.addClass ("dataCell");
		divisionCell.addClass ("patternCellBorder");
		if (line % 4 == 0) {
			divisionCell.addClass ("patternBeatRow");
		}
		if (line % 16 == 0) {
          	divisionCell.addClass ("patternBeatRow4");
		}
        divisionCell.text (((line < 10) ? "0" : "") + line);

	    row.append (divisionCell);

	    for (var i = 0; i < 8; i ++) {
			var channelCell = $("<td></td>");
			channelCell.addClass ("dataCell");
			if (i != 7) {
	            channelCell.addClass ("patternCellBorder");
			}
			//channelCell.addClass ("celllarge");
			if (line % 4 == 0) {
				channelCell.addClass ("patternBeatRow");
			}
			if (line % 16 == 0) {
            	channelCell.addClass ("patternBeatRow4");
			}

			var textLine;
			if (i < this.numChannels) {
				var noteName = this.notes[this.period[i][line]];
				if (typeof noteName == "undefined") noteName = "???";

            	textLine = noteName + " " +
		            ((this.sample[i][line] != 0) ? ((this.sample[i][line] < 10) ? "0" : "") + this.sample[i][line] + " " : ".. ");

				textLine += ".. ";
				if (this.effect[i][line] + this.effectX[i][line] + this.effectY[i][line] > 0) {
					textLine += hex.charAt (this.effect[i][line]);
					textLine += hex.charAt (this.effectX[i][line]);
					textLine += hex.charAt (this.effectY[i][line]);
				} else {
				    textLine += "...";
				}
			} else {
				textLine = "... .. .. ...";
			}

			channelCell.text (textLine);
		 	row.append (channelCell);
		}
	    
	    return row;
	};


	this.createHeader = function () {
    	var row = $("<tr></tr>");

		var rowCell = $("<td></td>");
		rowCell.addClass ("patternRowHeaderLeft");
        rowCell.addClass ("patternCellBorder");
		row.append (rowCell);

        for (var i = 1; i <= 8; i ++) {
			var headerCell = $("<td></td>");

			headerCell.attr ("id", "btnMute" + (i - 1));
			headerCell.addClass ("datacell");
            headerCell.addClass ("patternRowHeader");
			if (i != 8) {
            	headerCell.addClass ("patternCellBorder");
			}

			headerCell.text ("Channel " + ((i < 10) ? "0" : "") + i);

			headerCell.click (function () {
				var channel = $(this).attr ("id").split ("btnMute")[1];

				if (player.channelMute[channel]) {
                    player.channelMute[channel] = false;
					$(this).removeClass ("patternRowHeaderMute");
				} else {
                	player.channelMute[channel] = true;
                    $(this).addClass ("patternRowHeaderMute");
				}
			});

			row.append (headerCell);
		}

		return row;
	};
}