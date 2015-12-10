enableSaving [false, false]; 


if (isServer && "dzn_brv_enabled" call BIS_fnc_getParamValue > 0) then {
	[] execVM "dzn_brv\dzn_brv_init.sqf";
};
