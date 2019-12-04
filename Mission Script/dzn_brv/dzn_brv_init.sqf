//
// EXIT if...
if ("dzn_brv_enabled" call BIS_fnc_getParamValue == 0) exitWith {};	// Not enabled at MisPar
if (isMultiplayer && !isServer) exitWith {};				// Not a Server for MP Game

// ************ SETTINGS ***************

// Enable/Disable AI logging
dzn_brv_allowLogAI				= ("dzn_brv_enabledAILog" call BIS_fnc_getParamValue == 1); // Use current mission settings
//dzn_brv_allowLogAI				= false; // Hardcoded value


dzn_brv_playerLogInterval 			= 1; // seconds (min: 1 sec), accuracy of player's logging
dzn_brv_nonPlayerLogInterval		= 3; // seconds (min: 1 sec), accurcay of vehicles and AI (if enabled) logging
dzn_brv_attackVectorMaxDistance		= 1200; // meters

// ************** INIT *****************

dzn_brv_timeLabelInit	= if (isMultiplayer) then { round(serverTime) } else { round(time) };
dzn_brv_unitList 		= [];
dzn_brv_vehList 		= [];
dzn_brv_unitIdMax 		= 0;
dzn_brv_vehIdMax 		= 500;
dzn_brv_allowedVehiclesCategories	= ["LandVehicle","Air","Ship_F"];
dzn_brv_guid  		= "";

// Ensure correct interval values
if (dzn_brv_playerLogInterval < 1) then { dzn_brv_playerLogInterval = 1; };
if (dzn_brv_nonPlayerLogInterval < 1) then { dzn_brv_nonPlayerLogInterval = 1; };

call compile preprocessfilelinenumbers "dzn_brv\fn\dzn_brv_functions.sqf";

// Wait for mission start
waitUntil { time > 0 };
[] execFSM "dzn_brv\FSMs\dzn_brv_loop.fsm";
