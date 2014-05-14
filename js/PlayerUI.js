var mod = null;
var player = null;
var playing = false;
var solo = false;
var scroll = 0;
var cellLookup = [];

$(document).ready (function () {
	try {
		context = new webkitAudioContext ();
	} catch (e) {
		alert ("Web Audio API is not supported in this browser");
	}

	for (var i = 0; i < 16; i ++) {
		cellLookup[i] = [];
		var rowData = $("<tr/>");
		var cell = $("<td class=\"patternCellBorder dataCell\">" + ((i < 10) ? "0" : "") + i + "</td>");
		rowData.append (cell);
		cellLookup[i][0] = cell;
		
		for (var j = 0; j < 8; j ++) {
			cell = $("<td class=\"patternCellBorder dataCell\">... .. .. ...</td>");
			rowData.append (cell);	
			cellLookup[i][j + 1] = cell;
		}
		rowData.insertBefore ("#trPatScroll");	
	}

	$("#modFileChooser").change (function (e) {
		var file = e.target.files[0];

		var fileReader = new FileReader();
		fileReader.onloadend = function (fileLoadedEvent) {
			if (fileLoadedEvent.target.readyState == FileReader.DONE) {
				var fileNamePart = String (file.name).split (".");
				var fileType = fileNamePart[fileNamePart.length - 1].toLowerCase ();
				
				if (fileType == "mod") {
					mod = ModLoader (fileLoadedEvent.target.result);
				} else if (fileType == "s3m") {
					mod = S3mLoader (fileLoadedEvent.target.result);
				} else if (fileType == "xm") {
					mod = XmLoader (fileLoadedEvent.target.result);
				}
				
				player = new ScripTracker ();
				player.setRowCallbackhandler (playerUpdate);
				player.load (mod);
				
				// Set channel headers
				$("td[id^='tdPatHead']").each (function (i) {
					if (i >= mod.channels) {
						$(this).addClass ("patternRowHeaderMute");
						$(this).css ("cursor", "default");
					} else {
						$(this).removeClass ("patternRowHeaderMute");
						$(this).css ("cursor", "");
					}
				});
				
				$("#btnPlayPause").click ();
			}
		}

		fileReader.readAsBinaryString (file);
	});

	$(document).keydown (function (e) {
		if (e.keyCode == 68) {
			player.dump ();					
		}
	});

	$("#btnPlayPause").click (function () {
		if (!player.isPlaying ()) {
			$(this).removeClass ("btnPlay");
			$(this).addClass    ("btnPause");

			playing = true;
			player.play ();
		} else {
			$(this).removeClass ("btnPause");
			$(this).addClass    ("btnPlay");

			playing = false;
			player.stop ();
		}
	});


	$("#btnEject").click (function () {
		$("#btnPlayPause").removeClass ("btnPause");
		$("#btnPlayPause").addClass    ("btnPlay");
		if (player) {
			player.stop ();
		}

		$("#modFileChooser").trigger("click");
	});


	$("#btnPattern").click (function () {
		player.setPatternLoop (!player.isPatternLoop ());

		if (player.isPatternLoop ()) {
			$(this).addClass ("btnPatternDown");
		} else {
			$(this).removeClass ("btnPatternDown");
		}
	});


	$("#btnPrevOrder").click (function () {
		player.prevOrder ();
	});


	$("#btnNextOrder").click (function () {
		player.nextOrder ();
	});


	$("td[id^='tdPatHead']").click (function () {
		var channel = Number ($(this).attr ("id").split ("tdPatHead")[1]);

		if (channel + scroll < mod.channels) {
			player.setMute (channel + scroll, !player.isMuted (channel + scroll));
			
			if (player.isMuted (channel + scroll)) {
				$(this).addClass ("patternRowHeaderMute");
			} else {
				$(this).removeClass ("patternRowHeaderMute");
			}
		}
	});

	
	$("td[id^='tdPatHead']").bind ("contextmenu", function (e) {
		var channel = Number ($(this).attr ("id").split ("tdPatHead")[1]);
		if (channel + scroll >= mod.channels) return;

		if (!solo) {
			$("td[id^='tdPatHead']").addClass ("patternRowHeaderMute");
			for (var i = 0; i < mod.channels; i ++) {						
				player.setMute (i, true);
			}					
		
			$(this).removeClass ("patternRowHeaderMute");
			player.setMute (channel + scroll, false);
			
			solo = true;
		} else {
			$("td[id^='tdPatHead']").removeClass ("patternRowHeaderMute");
			
			for (var i = 0; i < mod.channels; i ++) {
				player.setMute (i, false);
			}
			
			solo = false;
		}
		
		return false;
	});

	
	$("#btnScrollLeft").click (function () {
		if (scroll > 0) {
			setScroll (scroll - 1);
		}
	});
	
	
	$("#btnScrollRight").click (function () {
		if (scroll < 24) {
			setScroll (scroll + 1);
		}
	});
	

	$(window).resize(function(){
		$('.tracker').css ({
			position:'absolute',
			left: ($(window).width  () - $('.tracker').outerWidth  ())  / 2,
			top:  ($(window).height () - $('.tracker').outerHeight ()) / 2
		});
	});

	$(window).resize();
});


function playerUpdate (player) {
	var row = player.getCurrentRow ();

	// Fill song info area.
	$("#txtSongName").text (player.getSongName ());
	$("#txtOrder").text    (player.getCurrentOrder () + "/" + player.getSongLength ());
	$("#txtPattern").text  (player.getCurrentPattern ());
	$("#txtRow").text      (row);
	$("#txtTempo").text    (player.getCurrentBPM () + "/" + player.getCurrentTicks ());

	var firstRow = Math.min (Math.max (0, row - 7), 48);
	for (var i = firstRow; i < firstRow + 16; i ++) {
		cellLookup [i - firstRow][0].text ((i < 10 ? "0" : "") + i);
		for (var j = 0; j < 8; j ++) {					
			cellLookup [i - firstRow][j + 1].text (player.getNoteInfo (j + scroll, i));
			cellLookup [i - firstRow][j + 1].css ("background", (i % 4 == 0) ? "#202020" : "#000000");
		}
	}

	// Hilight current row.
	$("#patternView td").removeClass ("rowPlayHead");
	if (row < 8) {
		$("#patternView tr:nth-child(" + (row + 1) + ") td").addClass ("rowPlayHead");
	} else if (row > 55) {
		$("#patternView tr:nth-child(" + (row - 46) + ") td").addClass ("rowPlayHead");
	} else {
		$("#patternView tr:nth-child(9) td").addClass ("rowPlayHead");
	}

	// Set instruments and VU meters.
	for (var i = 0; i < 8; i ++) {
		$("#tdVuInst" + i).text (player.isMuted (i + scroll) ? "** MUTE **" : player.getChannelInstrument (i + scroll).substring (0, 13));
		var v = player.isMuted (i + scroll) ? -1 : Math.round (player.getChannelVolume (i + scroll) * 16);
		$("#tdVuCell" + i + " div").each (function (j) {
			if (j < 12) {
				if (v > j) {
					$(this).attr ("class", "vuLed vuGreenOn");
				} else {
					$(this).attr ("class", "vuLed vuGreenOff");
				}
			} else {
				if (v > j) {
					$(this).attr ("class", "vuLed vuRedOn");
				} else {
					$(this).attr ("class", "vuLed vuRedOff");
				}
			}
		});
	}
}


function setScroll (leftCol) {
	scroll = leftCol;
	
	for (var i = 0; i < 8; i ++) {
		$("#tdPatHead" + i).text ("Channel " + ((leftCol + i + 1 < 10) ? "0" : "") + (leftCol + i + 1));
		if (player != null && player.isMuted (i + leftCol)) {
			$("#tdPatHead" + i).addClass ("patternRowHeaderMute");
		} else {					
			$("#tdPatHead" + i).removeClass ("patternRowHeaderMute");
		}
	}
	
	if (player != null) {
		playerUpdate (player);
	}
	
	$("#scrollButton").css ("margin-left", ((892 / 24) * leftCol) + "px");
}