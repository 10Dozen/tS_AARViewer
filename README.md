# Tactical Shift's AAR Viewer
Version: 0.92

## What is it?
This is a client-side browser-based Arma 3 After Action Report Viewer. It's uses only JavaScript, so there are only 2 requirements: modern browser (e.g. Google Chrome) and good graphic card (i guess, you have one if you are playing Arma 3).

## Demo
Demo page (thanks to aeroson): http://taw-arma.github.io/tS_AARViewer/
<br />Tactical Shift MilSim Community: http://aar.tacticalshift.ru

## Components
#### Mission Scripts Logger
Server-side SQF scripts to collect units data during the mission to Arma's RPT file (e.g. C:\Users\MyUser\AppData\Local\Arma 3). 
<br />Can be easily disabled by Mission Parameters.

#### AAR Converter
Allow to convert RPT file to one or several AAR files.
<br />Screenshots:
<br />http://puu.sh/mdzAL/3185672966.png
<br />http://puu.sh/mdzBv/0dde959149.png
<br />http://puu.sh/mdzBX/8159b49204.png

#### AAR Viewer
Allow to play AAR files in Browser (tested with Google Chrome).
<br />Islands available:
- Altis
- Stratis
- Chernarus
- Utes
- Bystica
- Takistan
- Zargabad
- Shapur
- Proving Grounds
- Sahrani (SMD_Sahrani_A3, CUP Sahrani)
- Porto
- Isla Abramia
- Kunduz
- Everon
- Malden
- Kolguev
- Nogova

Screenshots:
<br />http://puu.sh/mdzFH/ef9dc68a5f.png
<br />http://puu.sh/mdzGh/7169d93546.png
<br />http://puu.sh/mdzIa/f4055a3d1b.png

### How to use it?
- Create a mission and add Logger script to it.
- Play your mission
- Go to C:\Users\%YourUsername%\AppData\Local\Arma 3 and get latest <tt>.rpt</tt> file
- Open AAR Converter and open .rpt file from it, then choose logged game. Populate fields with your custom description for the mission and click - "Save AAR to file".
- Open AAR Viewer and open your generated AAR file with it. Click "Play" and wait until map loaded. 
- Use mouse RMB to pan, and mouse wheel to zoom. If you can't find units - click Help icon at the upper-right corner - it will draw a purple lines from map corner to all units. 
