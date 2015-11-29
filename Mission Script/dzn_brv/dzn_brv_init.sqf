
// ************ SETTINGS ***************
dzn_brv_playerLogInterval 		= 1; // seconds
dzn_brv_nonPlayerLogInterval		= 3; // seconds

// ************** INIT *****************
dzn_brv_timeLabel 	= 0;
dzn_brv_unitList 		= [];
dzn_brv_vehList 		= [];
dzn_brv_unitIdMax 	= 0;
dzn_brv_vehIdMax 		= 500;


call compile preprocessfilelinenumbers "dzn_brv\fn\dzn_brv_functions.sqf";
[] execFSM "dzn_brv\FSMs\dzn_brv_loop.fsm";
