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

### How to extend Map compatibility?
1. Get 2d map from Arma via TOPOGRAPHY cheat (see https://community.bistudio.com/wiki/ArmA:_Cheats for details). It will dump map in .emf format to your C:/ drive

2. Convert .emf to .png (there is a tutorial and converter http://killzonekid.com/arma-scripting-tutorials-how-to-export-topography/ ). I've noticed that Arma3 version of emf2png working bad, so use Arma2 version of the converter.

3. Now open your .png file in photoshop (or corel or whatever app that can resize image and convert it to indexed colors with configurable pallete)

4. Map should be a square for better accuracy. If map is bigger than 10241px, then you should resize it (extra large images are handled weird by browser). E.g. for map of 15361px it will be enough to divide by 1.5 => 15361 / 1.5 = 10241. Remeber divider, it will be needed for config.

5. Switch image to Indexed colors and edit it's pallete. Your goal is to leave about 8-12 colors, so make all similar shades exactly the same color (e.g. 1 green color, 1 white, 1 black, 1 gray, 1 blue, 1 orange (for roads), 1 pale orange (offroads), 1 brown (terrain height lines) - it will be enough to represent all elements in the map)

6. Now save the image and edit /Viewer/config.ini file and add your map to JS-array in format:
[ @worldname, { "size": @imagesize, "scale": @imagescale, "img": @pathtoimagefile } ]
, where:
@worldname -- arma's world name (island name in config or from saved editor mission folder, e.g. MissionName.Altis);
@imagesize -- size of image (number, e.g. 10241);
@imagescale -- divider from step 4 (number, e.g. 1.5 -> 10241 * 1.5 = 15361 - original map scale);
@pathtoimagefile -- path to file (as string, e.g. "src/maps/Stratis_8192_1.png")
