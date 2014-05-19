/**
 * Enums.js
 *
 * Globally used types by ScripTracker.
 *
 * Author:  		Maarten Janssen
 * Date:    		2014-05-19
 * Last updated:	2014-05-19
 */


// List of module types.
var ModTypes = {
	MOD: 0,
	S3M: 1,
	IT:  2,
	XM:  3
};


 // Sample loop types.
 var SampleLoop = {
	LOOP_NONE:     0,
	LOOP_FORWARD:  1,
	LOOP_PINGPONG: 2
 }
 
 
 // Internal data formats of sample within the module file.
 var SampleFormat = {
	FORMAT_8BIT:  0,
	FORMAT_16BIT: 2,
 
	TYPE_UNCOMPRESSED: 0,
	TPYE_DELTA:        2,
	TPYE_ADPCM:        4
 }
 
 
 // List of envelope types.
 var EnvelopeType = {
	NONE:    0,
	ON:      1,
	SUSTAIN: 2,
	LOOP:    4
 }