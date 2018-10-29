/////////////////////////////////////////////////////
JS Test Task - Slot Machine
by Dmitri Mitikov
10.28.2018
/////////////////////////////////////////////////////
USED:
PIXIJS - pixi.min.js
PIXITextInput - PixiTextInput.js
TweenLite - TweenLite.js
-----------------------------------------------------


HOW IT WORKS:
There always are 3 collections of symbols. 
On each button press old collections are swaped 
with new collections keeping only symbols shown on screen.

If Debug mode is on first symbols of new collections will be changed on selected. 
After new collections are done and before animation starts. 

Animations are done using tween to function from TweenLite library.
PIXITextInput graphic container with input handling.


DEBUG SETTINGS
Elements:
1. Field to enter Player Balance - Not recommended to go over 9999 because of Design.
2. On/Off Button (green/red) to turon on and off Debug Mode
3. Fields to enter symbols - Symbols should be entered in orderd from top to bottom splited by comma.
4. Screen map - Shows selected screen pattern
5. Exit & Save button - Black rectangle at the right top corner.

NB! Changes applied on Exit & Save button pressed.


LIVE DEMO - http://128.199.47.179/testtask/index.html