# Tactical Shift's AAR Viewer
Version: 0.3

## What it is?
This is a client-side browser-based Arma 3 After Action Report Viewer. It's uses only JavaScript, so there are only 2 requirement: modern browser (e.g. Google Chrome) and good graphic card (i guess, you have one if you are playing Arma 3).

#### Mission Scripts Logger
SQF scripts to collect units data during the mission to Arma's RPT file (e.g. C:\Users\MyUser\AppData\Local\Arma 3). 
<br />Can be easily disabled by Mission Parameters.

#### AAR Converter
Allow to convert RPT file to one or several AAR files.
<br />Screenshots:
<br />http://puu.sh/mbCGv/649bd4e363.png
<br />http://puu.sh/mbCBy/f76b6e45b2.png
<br />http://puu.sh/mbCGv/649bd4e363.png

#### AAR Viewer
Allow to play AAR files in Browser (tested with Google Chrome).
<br />Screenshots:
<br />http://puu.sh/mbCPn/c033b60019.png
<br />http://puu.sh/mbCRd/18e625046d.png
<br />http://puu.sh/mbCVU/15583aaa1e.jpg

### How to use it?
- Create a mission and add Logger script to it.
- Play your mission
- Go to C:\Users\%YourUsername%\AppData\Local\Arma 3 and get latest <tt>.rpt</tt> file
- Open AAR Converter and open .rpt file from it, then choose logged game and click 'Generate'. Populate fields with your custom description for the mission and click - "Generate AAR" and then "Save AAR to file"
- Open AAR Viewer and openyour generated AAR file from it. Click "Play" and wait until map loaded. 
- Use mouse RMB to pan, and mouse wheel to zoom. If you can't find units - click Help icon at the upper-right corner - it will draw a purple lines from map corner to all units. 
