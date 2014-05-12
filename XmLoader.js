function XmLoader (fileData) {
	mod          = new Module ();
	mod.type     = ModTypes.xm;
	
	var headerSize      = readDWord (fileData, 60);
	var offset          = 0;
	
	mod.name            = fileData.substring (17, 37);
	mod.songLength      = readWord (fileData, 64);
	mod.restartPosition = readWord (fileData, 66);
	mod.channels        = Math.min (readWord (fileData, 68), 32);		// Hard limit number of channels to 32
	mod.patternCount    = readWord (fileData, 70);
	mod.sampleCount     = readWord (fileData, 72);
	mod.defaultTempo    = readWord (fileData, 76);
	mod.defaultBPM      = readWord (fileData, 78);
	
	for (var i = 0; i < mod.songLength; i ++) {
		mod.orders.push (fileData.charCodeAt (80 + i));
	}

	// Decode pattern data.
	offset += headerSize + 60;
	for (var p = 0; p < mod.patternCount; p ++) {		
		var pHeaderSize = readDWord (fileData, offset);
		var pRows       = readWord  (fileData, offset + 5);
		var pDataSize   = readWord  (fileData, offset + 7);
		
		var pattern = new Pattern (pRows, mod.channels);
		pattern.patternIndex = p;
				
		if (pDataSize != 0) {
			var pDataOffset = offset + pHeaderSize;
			var lastSample  = 0;
			
			for (var r = 0; r < pRows; r ++) {
				for (var c = 0; c < mod.channels; c ++) {
					var note = fileData.charCodeAt (pDataOffset ++);
					
					// Regular note info.
					if ((note & 0x80) == 0) {
						pattern.note[r][c]        = note;
						pattern.sample[r][c]      = fileData.charCodeAt (pDataOffset ++);
						pattern.volume[r][c]      = Math.min ((fileData.charCodeAt (pDataOffset ++) - 16) / 64, 1.0);
						pattern.effect[r][c]      = fileData.charCodeAt (pDataOffset ++);
						pattern.effectParam[r][c] = fileData.charCodeAt (pDataOffset ++);
					
					// Packed note info.
					} else {
						if ((note & 0x01) != 0) pattern.note[r][c]        = fileData.charCodeAt (pDataOffset ++);						
						if ((note & 0x02) != 0) pattern.sample[r][c]      = fileData.charCodeAt (pDataOffset ++);						
						if ((note & 0x04) != 0) {
							pattern.volume[r][c] = Math.min ((fileData.charCodeAt (pDataOffset ++) - 16) / 64, 1.0);
						} else {
							pattern.volume[r][c] = 1.0;
						}
						if ((note & 0x08) != 0) pattern.effect[r][c]      = fileData.charCodeAt (pDataOffset ++);
						if ((note & 0x10) != 0) pattern.effectParam[r][c] = fileData.charCodeAt (pDataOffset ++);
						
						// If we have an effect param, but no effect treat the effect as 0.
						if ((note & 0x08) == 0 && (note & 0x10) != 0) {		
							pattern.effect[r][c] = 0;
						}
					}

					// Decode the effect if there is one.
					if (pattern.effect[r][c] != Effects.NONE) {
						pattern.effect[r][c] = parseEffect (pattern.effect[r][c], pattern.effectParam[r][c]);
					}
				}
			}
		}
		
		mod.patterns.push (pattern);
		offset += pHeaderSize + pDataSize;
	}
	

	// Read instrument and sample data.
	for (var i = 0; i < mod.sampleCount; i ++) {
		var instrumentSize = readDWord (fileData, offset);
		var iName          = fileData.substring (offset + 4, offset + 26);
		var iType          = fileData.charCodeAt (offset + 26);
		var iNSamples      = readWord (fileData, offset + 27);
		
		offset += instrumentSize;
		if (iNSamples == 0) {
			mod.samples.push (new Sample ()); 
		}
		
		// Load sample headers.
		for (var s = 0; s < iNSamples; s ++) {
			var sample = new Sample ();
			
			sample.sampleLength = readDWord (fileData, offset);
			sample.loopStart    = readDWord (fileData, offset + 4);
			sample.loopLength   = readDWord (fileData, offset + 8);
			
			sample.volume       = fileData.charCodeAt (offset + 12) / 64.0;
			sample.fineTune     = (fileData.charCodeAt (offset + 13) < 128) ? fileData.charCodeAt (offset + 13) : -((fileData.charCodeAt (offset + 13) ^ 0xFF) + 1);
			sample.loopType     = (sample.loopLength > 0) ? (fileData.charCodeAt (offset + 14) & 0x03) : sample.LOOP_NONE;
			sample.dataType     = ((fileData.charCodeAt (offset + 14) & 0x10) == 0) ? sample.TYPE_8BIT : sample.TYPE_16BIT;
			sample.panning      = fileData.charCodeAt (offset + 15) / 255.0;
			sample.basePeriod   = fileData.charCodeAt (offset + 16);			
			sample.dataType    |= (fileData.charCodeAt (offset + 17) == 0xAD) ? sample.TYPE_ADPCM : sample.TYPE_DELTA;
			sample.name         = iName;
						
			// Correct sample base period.
			if (sample.basePeriod > 127) sample.basePeriod = -(256 - sample.basePeriod);
			sample.basePeriod = -sample.basePeriod + 24;
						
			mod.samples.push (sample);
			offset += 40;
		}			
		
		// Load sample data.
		for (var s = 0; s < iNSamples; s ++) {
			var sample = mod.samples[mod.samples.length - iNSamples + s];

			if (sample.sampleLength > 0) {
				var sampleData = fileData.substring (offset, offset + sample.sampleLength);
				var is16Bit    = (sample.dataType & sample.TYPE_16BIT) != 0;
				
				if ((sample.dataType & Sample.TYPE_DELTA) == 0) {
					sample.loadDeltaSample (sampleData, is16Bit);
				} else {
					sample.loadAdpcmSample (sampleData, is16Bit);
				}
			}
			
			offset += sample.sampleLength;
		}
	}
	
	return mod;
}


function parseEffect (effect, param) {
	switch (effect) {
		case 0:
			return Effects.ARPEGGIO;
		case 1:
			return Effects.PORTA_UP;
		case 2:
			return Effects.PORTA_DOWN;
		case 3:
			return Effects.TONE_PORTA;
		case 4:
			return Effects.VIBRATO;
		case 5:
			return Effects.TONE_PORTA_VOL_SLIDE;
		case 6:
			return Effects.VIBRATO_VOL_SLIDE;
		case 7:
			return Effects.TREMOLO;
		case 8:
			return Effects.SET_PAN;
		case 9:
			return Effects.SAMPLE_OFFSET;
		case 10:
			return Effects.VOLUME_SLIDE;
		case 11:
			return Effects.POSITION_JUMP;
		case 12:
			return Effects.SET_VOLUME;
		case 13:
			return Effects.PATTERN_BREAK;
		case 14:
			break;
		case 15:
			return Effects.SET_TEMPO_BPM;
		case 16:
			return Effects.SET_GLOBAL_VOLUME;
		case 17:
			return Effects.GLOBAL_VOLUME_SLIDE;
		case 21:
			return Effects.ENVELOPE_POSITION;
		case 25:
			return Effects.PAN_SLIDE;
		case 27:
			return Effects.MULTI_RETRIGGER;
		case 29:
			return Effects.TREMOR;
		case 33:
			break;
		default:
			return Effects.NONE;
	}
	
	return Effects.NONE;
}


function readWord (buffer, offset) {
	return buffer.charCodeAt (offset) +
		(buffer.charCodeAt (offset + 1) << 8);
}


function readDWord (buffer, offset) {
	return buffer.charCodeAt (offset) +
		(buffer.charCodeAt (offset + 1) << 8) +
		(buffer.charCodeAt (offset + 2) << 16) +
		(buffer.charCodeAt (offset + 3) << 24);
}