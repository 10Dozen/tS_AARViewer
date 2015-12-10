			var rptData = "";
			var reportGuid = "";
			
			// Open file
			var openFile = function(event) { 
				$( "#result-form" ).css( "top", "-1000px" );
				$( "#mission-desc" ).val("");
				$( "#mission-date" ).val("");
				$( "#output" ).val("");
				$( "#uploader-convert" ).attr( "disabled", "true" );
				reportGuid = "";
				
				var input = event.target; 
				var reader = new FileReader(); 
				reader.onload = function(){ 
					var text = reader.result;
					rptData = text;
					if (text.length > 0) {
						console.log( "Read!");
						var listOfDirtyMetadata = rptData.match( /(.*)<AAR-.*><meta><core>(.*)<\/core><\/meta><\/AAR-.*>/ig); 
						
						if (listOfDirtyMetadata.length > -1) {
							if (listOfDirtyMetadata.length == 1) {
								reportGuid = JSON.parse( (rptData.match( /(.*)<AAR-.*><meta><core>(.*)<\/core><\/meta><\/AAR-.*>/i)[2]) ).guid;
								
								$( "#header-status > label" ).html( "Ready for convertion!" );
								$( "#header-status" ).css( "background-color", "#9BC34E");
								$( "#uploader-convert" ).removeAttr( "disabled" );
							} else {
								var listOfMetadata = [];
								for (var i = 0; i < listOfDirtyMetadata.length; i++) {
									var parsedMeta = listOfDirtyMetadata[i].match( /(.*)<AAR-.*><meta><core>(.*)<\/core><\/meta><\/AAR-.*>/i);
									var meta = JSON.parse( parsedMeta[2] )
									meta.logTime = parsedMeta[1].slice(0,-2);
									
									$( "#report-selector" ).append(
										"<li onClick='reportGuid = \"" + meta.guid + "\"'>" + meta.logTime + " - (" + meta.island + ") " + meta.name + "</li>"									
									);
								}
								
								$( "#header-status > label" ).html( "Select AAR to Convert!" );
								$( "#header-status" ).css( "background-color", "#9BC34E");
								$( "#report-selector" ).css( "top", "300px" );
								
							}
						} else {
							console.log( "Not an AAR!" );
							$( "#header-status > label" ).html( "File does not contain AAR data!" );
							$( "#header-status" ).css( "background-color", "#AF4E4E");
							$( "#uploader-convert" ).attr( "disabled", "true" );
						}
					} else {
						console.log( "Empty!" );
						$( "#header-status > label" ).html( "File is empty/Failed to read!" );
						$( "#header-status" ).css( "background-color", "#AF4E4E");
						$( "#uploader-convert" ).attr( "disabled", "true" );
					}
				};				
				reader.readAsText(input.files[0]);
			};
			
			var aarData, a;
			function convertToAAR() {
				 aarData = {
					"metadata": {
						"island": "",
						"name": "",
						"time": 0,
						"date": "",
						"desc": "",
						"players": [],
						"objects": {
							"units": [],
							"vehs": []					
						}
					},
					"timeline": []
				};
				
				var consoleMsgEnabled = true;
				var consoleDebugEnabled = false;
				function logMsg(t) { if (consoleMsgEnabled) { console.log( t ) }};
				function logDebug(t) { if (consoleDebugEnabled) { console.log( t ) }};
				
				$( "#header-status > label" ).html( "In progress..." );
				
				var re = new RegExp( "<AAR-" + reportGuid + ">.*<\/AAR-" + reportGuid + ">", "g" )
				var rptItems = rptData.match( re );
				var metadataCore = JSON.parse( ( rptItems[0].match( /(<core>)(.*)(<\/core>)/i) )[2] ); 
				
				logMsg( "Metadata: Core [ Processing ]" );
				aarData.metadata.island = metadataCore.island;
				aarData.metadata.name = metadataCore.name;
				logMsg( "Metadata: Core [ OK ]" );
				
				logMsg( "Metadata: Units [ Processing ]" );				
				var metadataObjectsRaw = rptData.match( /(<meta><unit>)(.*)(<\/unit><\/meta>)/ig);
				for (var i = 0; i < metadataObjectsRaw.length; i++) {
					var u = JSON.parse( metadataObjectsRaw[i].match( /(<meta><unit>)(.*)(<\/unit><\/meta>)/i)[2] );
					(aarData.metadata.objects.units).push(u.unitMeta);
					if (u.unitMeta[3] > 0) {
						(aarData.metadata.players).push( [u.unitMeta[1],u.unitMeta[2]] );
					}
				}
				logMsg( "Metadata: Units [ OK ]" );
				
				logMsg( "Metadata: Vehicles [ Processing ]" );
				metadataObjectsRaw = rptData.match( /(<meta><veh>)(.*)(<\/veh><\/meta>)/ig);
				for (var i = 0; i < metadataObjectsRaw.length; i++) {
					var u = JSON.parse( metadataObjectsRaw[i].match( /(<meta><veh>)(.*)(<\/veh><\/meta>)/i)[2] );
					(aarData.metadata.objects.vehs).push(u.vehMeta);
				}
				logMsg( "Metadata: Vehicles [ OK ]" );
				
				// Timeline item:	(<\d>)(.*)(<\/\d>)				
				logMsg( "Timeline: Basic [ Processing ]" );
				var timelinesRaw = rptData.match( /(<\d+>)(.*)(<\/\d+>)/ig );
				for (var i = 0; i < timelinesRaw.length; i++) {
					var t = timelinesRaw[i].match( /(<\d+>)(.*)(<\/\d+>)/i );
					var timelabel = t[1].match( /(<)(\d+)(>)/i)[2];
					var unittype = t[2].match( /(<unit>|<veh>|<av>)(.*)(<\/unit>|<\/veh>|<\/av>)/i )[1];
					var unitdata = t[2].match( /(<unit>|<veh>|<av>)(.*)(<\/unit>|<\/veh>|<\/av>)/i )[2];
					
					if (typeof (aarData.timeline[timelabel]) == "undefined") {
						aarData.timeline[timelabel] = [ [], [], [] ];
					}
					
					switch (unittype) {
						case "<unit>": 
							(aarData.timeline[timelabel])[0].push( JSON.parse(unitdata) );
							break;
						case "<veh>":
							(aarData.timeline[timelabel])[1].push( JSON.parse(unitdata) );
							break;
						case "<av>":
							(aarData.timeline[timelabel])[2].push( JSON.parse(unitdata) );
							break;
					}
				};
				logMsg( "Timeline: Basic [ OK ]" );
				
				logMsg( "Timeline: Interpolating Transitions of Units [ Processing ]" );
		
				/*
					For each UNIT check all timelines.
						If there are no data for timeline 
						- select last time when data exists then find time when data exists next (or end of time)
						- then for each time between last known and latest time - calculate/interpolate values of position
						- add this data to timeline
						- check for another range				
				*/				
				for (var m = 0; m < 2; m++) {
					var unitList, unitTypeId;

					if (m == 0) {
						unitList = aarData.metadata.objects.units;
						unitTypeId = 0;
					} else {
						unitList = aarData.metadata.objects.vehs;
						unitTypeId = 1;
					}
					
					for (var i = 0; i < unitList.length; i++ ) {
						var unitId = unitList[i][0];
						logDebug("INTERPOLATION FOR UNIT " + unitId);
						
						var lastKnown = [];
						var actualKnown = [];
						var stepsToInterpolate = [];
						for (var j = 0; j < aarData.timeline.length; j++) {
							for (var k = 0; k < aarData.timeline[j][unitTypeId].length; k++) {
								if (aarData.timeline[j][unitTypeId][k][0] == unitId || j == (aarData.timeline.length - 1)) {
									logDebug("Time " + j + " unit data is here! " + aarData.timeline[j][unitTypeId][k]);
									
									if (lastKnown.length == 0) {
										logDebug("Start of Interpol Range");
										lastKnown = aarData.timeline[j][unitTypeId][k];
									} else {
										if (actualKnown.length == 0) {
											logDebug("End of Interpol Range");
											actualKnown = aarData.timeline[j][unitTypeId][k];										
										}
									}
								}
							}
							
							if (lastKnown.length > 0 && actualKnown.length == 0) {
								logDebug("Adding time to empty");
								stepsToInterpolate.push(j);
							} else {
								if (lastKnown.length > 0 && actualKnown.length > 0) {
									logDebug("Interpolation ( @" + lastKnown[1] + ", @" + actualKnown[1] + ", @" + stepsToInterpolate.length + ")");
							
									var posxSteps = interpolateValues( lastKnown[1], actualKnown[1], stepsToInterpolate.length );
									var posySteps = interpolateValues( lastKnown[2], actualKnown[2], stepsToInterpolate.length );
									var dirSteps = lastKnown[3];
									//var dirSteps = interpolateValues( lastKnown[3], actualKnown[3], stepsToInterpolate.length );
								
									logDebug("Interpolation... | X: " + posxSteps + " || Y: " + posySteps + " || DIR: " + dirSteps);								
									// Start with 1, because 0 is equal to lastKnown value and we may not update it
									for (var l = 1; l < stepsToInterpolate.length; l++ ) {
										logDebug( "Time (" + stepsToInterpolate[l] + ")" + [unitId, posxSteps[l], posySteps[l], dirSteps, lastKnown[4], lastKnown[5] ] );
									
										if (m == 0) {
											( aarData.timeline[stepsToInterpolate[l]][unitTypeId] ).push( [unitId, posxSteps[l], posySteps[l], dirSteps, lastKnown[4], lastKnown[5]]  );
										} else {
											( aarData.timeline[stepsToInterpolate[l]][unitTypeId] ).push( [unitId, posxSteps[l], posySteps[l], dirSteps, lastKnown[4], lastKnown[5], lastKnown[6]]  );
										}
									}
								
									lastKnown = [];
									actualKnown = [];
									stepsToInterpolate = [];								
									// Step back to get new start interpolation range
									j = j - 1;
								}
							}
						}
					}
				}
				
				aarData.metadata.time = (aarData.timeline).length - 2;
				logMsg( "Timeline: Interpolating Transitions of Units [ OK ]" );
			
				logMsg( "Creating form" );
				$( "#player-list" ).html( "" );
				$( "#mission-name" ).val( aarData.metadata.name );
				$( "#mission-island" ).val( aarData.metadata.island );
				$( "#mission-time" ).html( getTimeLabel(aarData.metadata.time) );
				for (var i = 0; i < aarData.metadata.players.length; i++) {
					var color;
					switch (aarData.metadata.players[i][1]) {
						case "blufor": color = "RGB(0,77,152)"; break;
						case "opfor": color = "RGB(127,0,0)"; break;
						case "indep": color = "RGB(0,127,0)"; break;
						case "civ": color = "RGB(102,0,127)"; break;
					};
					$( "#player-list" ).append( "<li class='player-side-icon' style='padding: 2px 4px; background-color: " + color + "'>" + aarData.metadata.players[i][0] + "</li>" );				
				}
				
				logMsg("Done!");				
				$( "#result-form" ).css( "top", "60px" );
				$( "#header-status > label" ).html( "Converted!" );
				$( ".dl-2 > input, textarea, button" ).removeAttr( "disabled" );
				$( "#output-save" ).attr( "disabled", "true" );
			};
			
			// Interpolate values
			function interpolateValues(min,max,steps) {
				var output = [];
				var delta = (max - min)/steps;
				for (var i = 0; i < steps; i++) { output.push( Math.round( min + i*delta ) ); }
				
				return output			
			}
			
			// Time label
			function getTimeLabel(t) {
				var time = t;
				var timeHours = time / 60 /60 | 0;
				var timeMinutes = (time - timeHours*60*60) /60 | 0;
				var timeSeconds = time - timeHours*60*60 - timeMinutes*60;
				var output = "";
				function formatTimeNum(t,l) {
					var output = t + " " + l + " ";					
					if (t > 0) { 
						if (t < 10) {output = "0" + output;} 
					} else { 
						if (l == "s") {
							output = "00 s"
						} else {
							output = ""
						}
					}
					return output
				}				
				return formatTimeNum(timeHours,"h") + formatTimeNum(timeMinutes,"m") + formatTimeNum(timeSeconds,"s")
			}
			
			// Generate
			function generateAAR() {			
				aarData.metadata.date = $( "#mission-date" ).val();
				aarData.metadata.desc = $( "#mission-desc" ).val();
				aarData.metadata.island = $( "#mission-island" ).val();
				aarData.metadata.name = $( "#mission-name" ).val();
				console.log( "AAR text generated.");
			}
			
			function showGeneratedAAR() {
				generateAAR();
				$( "#output-save" ).removeAttr("disabled");
				$( "#output" ).val( JSON.stringify( aarData ) );
				console.log( "AAR text generated.");				
			}
			
			function saveGeneratedAARData() {
				saveAARFile( $( "#output" ).val() );				
			}
			
			// File Save
			function saveAARFile(data) {
				var a = document.createElement('a');
				a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent( JSON.stringify( aarData ) ));
				a.setAttribute('download', "[AAR][" + aarData.metadata.island + "] " + aarData.metadata.name );
				a.click();
			}
			
			$( document ).ready(function() {
				$( ".dl-2 > input, textarea, button" ).attr( "disabled", "true" );				
			});
