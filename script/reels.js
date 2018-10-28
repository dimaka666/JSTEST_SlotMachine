{
   
    //Aliases
    let Application = PIXI.Application,
        Container = PIXI.Container,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Graphics = PIXI.Graphics,
        TextureCache = PIXI.utils.TextureCache,
        Sprite = PIXI.Sprite,
        Text = PIXI.Text,
        TextStyle = PIXI.TextStyle;

    //Create a Pixi Application
    let app = new Application({ 
        width: 800, 
        height: 500,                       
        antialiasing: true, 
        transparent: false, 
        resolution: 1
      }
    );
    
    //Add canvas
    document.body.appendChild(app.view);
    
    //Load sprites
    loader
      .add("../assets/sprites.json")
      .load(setup);
    
    //Alias for sprites
    let id;
 
    //Container for visuals
    let reelsContainer;
    
    let highlighters;
    
    //Reels object collection
    let reels = [];
    
    //Collection of symbols;
    let symbols = [];
    
    //Generated stack of symbols
    let symbolsStack;
    
    let winnings = [];

    //Settings
    let DEBUG_SCREEN = false;
    let DEBUG_MODE = false;
    let DEBUG_CASE = [[2],[1,1],[1]];
    let temp_pattern = [];
    
    let REELS_COUNT = 3;
    let REEL_WIDTH = 132;
    let REEL_LENGTH = 30;
    let SYMBOL_SIZE = 93;
    let PLAYER_BALANCE = 1000;
    let SPIN_PRICE = 10;
    let SPINNING_TIME = 2000;
    let FONT_STYLE = new TextStyle({
        fontFamily: "Impact",
        fontSize: 16,
        fill: 0xfffcec,
        letterSpacing: 5
      });
    
    let PAY_LINES_LINK = ["3xCherry_top","3xCherry_Center","3xCherry_Bottom", "3xSeven","CheryXSeven","3x3Bar", "3x2Bar","3xBar","2xBar",]
    
    let PAY_LINES = [
        ["3xCherry_top",["Cherry.png","Cherry.png","Cherry.png"], 0, 2000],
        ["3xCherry_Center",["Cherry.png","Cherry.png","Cherry.png"], 1, 1000],
        ["3xCherry_Bottom",["Cherry.png","Cherry.png","Cherry.png"], 2, 4000],
        ["3xSeven",["7.png","7.png","7.png"], null, 150],
        ["CheryXSeven",["Cherry.png","7.png"], null, 75],
        ["CheryXSeven",["7.png", "Cherry.png"], null, 75],
        ["3x3Bar",["3xBAR.png","3xBAR.png","3xBAR.png"], null, 50],
        ["3x2Bar",["2xBAR.png","2xBAR.png","2xBAR.png"], null, 20],
        ["3xBar",["BAR.png","BAR.png","BAR.png"], null, 10],
        ["2xBar",["BAR.png","BAR.png"], null, 5]
    ];
    
    
    //Reels running flag
    let running = false;
    let runCount = 0;
    
    //Setting up scene after assets are loaded
    function setup(){
        
        reelsContainer = new Container();
        highlighters = new Container();
        
        //Alias for textures
        id = resources["../assets/sprites.json"].textures;
        
        //Collections of symbols
        symbols = [
            id["2xBAR.png"],
            id["3xBAR.png"],
            id["BAR.png"],
            id["Cherry.png"],
            id["7.png"]
        ]
        
        //Random symbol stack generator.
        symbolsStack = function(){
            let arr = [];
            for(let i = 0; i<REEL_LENGTH; i++){
                arr.push(new Sprite(symbols[Math.floor(Math.random()*symbols.length)]));
            }
            return arr;
        }
        
        //Setting Reels graphics
        setBackgrounds();
        
        app.stage.addChild(highlighters);
        
        //First run symbols generator
        for(let i = 0; i < REELS_COUNT; i++){
            
            let offsetYType = Math.floor(Math.random()*2);
            
            let colContainer = createColContainer(i, offsetYType, true);
            reelsContainer.addChild(colContainer);
            
            let col = createCol(colContainer, offsetYType);
            
            for(let j = 0; j < REEL_LENGTH; j++){
                
                let symbol = createSymbol(j);
                colContainer.addChild(symbol);
            }
            
            reels.push(col);        
        }  
    }
    
        //Start Game function. Removes visual effects. Charges player balance. Call resetContainer to reset symbols before animation.
    function startPlay(){
        if(running) return;

        PLAYER_BALANCE -= 1;

        updateBalance(PLAYER_BALANCE);
        switchButton(true);
        highlightsOff();
        offBulbs();
        winnings = [];
        resetContainer();


        //If Debug mode is activated replace destenition symbols with given by pattern
        if(DEBUG_MODE){   
            for(let i = 0; i < reels.length; i++){
                
                let c = reels[i];
                let len = DEBUG_CASE[i].length;
                
                for(let s = 0; s < len; s++){
                    
                    let index = s;
                    if(len == 1) index = 1;
                    c.container.children[index].texture = symbols[DEBUG_CASE[i][s]];           
                    (len == 2) ? c.offsetY = 0 : c.offsetY = 1;
                }
            }
        }
        running = true;


        //Run animation for each reel. Randomize end position (top&bot/center). Calls reelsComplete on end
        for(let i = 0; i < reels.length; i++){
            
            let c = reels[i];   
            let offsetY;

            if(!DEBUG_MODE){
                
                if(Math.floor(Math.random()*2) < 1) {
                    
                    offsetY = -10;
                    c.offsetY = 0;
                    
                } else {
                    
                    offsetY = -64;
                    c.offsetY = 1;
                    
                }   
            } else {
                
                offsetY = (c.offsetY < 1) ? -10 : -64;
                
            }

            runCount++;
            TweenLite.to(c.container, 3 + (i/10), {y: offsetY, onComplete: reelsComplete});
        }   
    }

    //Function is called on Game start. Swiches previous stack of symbols with newly generated.
    function resetContainer(){
        
        let nReels = [];  
        
        for(let t = 0; t < REELS_COUNT; t++){
            
            let reel = reels[0];
            let colc = reel.container;
            let currentSymbols = colc.children;
           
            let colContainer = createColContainer(t, reel.offsetY, false)
            
            let col = createCol(colContainer, reel.offsetY);        
           
           for(let j = 0; j < REEL_LENGTH - 3; j++){

                let symbol = createSymbol(j);
                colContainer.addChild(symbol);

            }
            
            let y = currentSymbols[currentSymbols.length - 3].y;

            
            for(let k = 0; k < 3; k++){
                
                let p = currentSymbols[0];
                p.y = y + SYMBOL_SIZE * k;
                colContainer.addChild(p);

            }
            
            reels.splice(0,1);
            nReels.push(col);
            colc.destroy;
            reelsContainer.removeChild(colc);
            reelsContainer.addChild(colContainer); 
            
            
        }
        reels = nReels;        
    }
    

    
    //Wait for all reels to finish. Change running state. Check for winnings. Updates button state.
    function reelsComplete(){
        runCount--;
        if(runCount == 0){
            running = false;
            linesCheck();
            switchButton(false);
        }  
    }
    
    
    //Gather symbols on screen. Define line & check for winning combinations.
    function linesCheck(){

        //Screen capture
        let screen = [[],[],[]];
        for(let i = 0; i < reels.length; i++){
            
            let colContaner = reels[i].container.children;
            let colY = reels[i].offsetY;
            
            for(let j = 0; j < 2; j++){
                
                let name;
                if(colY == 0){
                    
                    name = colContaner[j]._texture.textureCacheIds[0];
                    screen[i].push(name); 
                    
                } else {
                    
                    name = colContaner[1]._texture.textureCacheIds[0];
                    screen[i].push(name);
                    break;
                    
                }    
            }   
        }
        
        //Get possible combinations and define line
        for(let j = 0; j < screen[0].length; j++){
            
            let code = [];
            let index = j;
            
            if(screen[0].length == 1) {
                    
                index = 1; 
                    
            } else {
                    
                if(screen[0].length == 2 && j == 1) index = 2;
                    
            }
            
            if(screen[0].length == screen[1].length && screen[0].length == screen[2].length) {
                
                code.push([String([screen[0][j], screen[1][j], screen[2][j]]), index]);
                
            } else {
                
               if(screen[0].length == screen[1].length) {
                   
                    code.push([String([screen[0][j], screen[1][j]]), index]);
                   
                }
                
                if(screen[1].length == screen[2].length){
                    
                    if(screen[1].length == 1) index = 1;
                    code.push([String([screen[1][j], screen[2][j]]), index]);
                    
                }
            }
            
            //Check for winnings. Ident winning line with bulbs.
            if(code.length != 0){
                   for(let k = 0; k < PAY_LINES.length; k++){
                    let ex = String(PAY_LINES[k][1]);
                    let exReg = new RegExp('\\b' + ex + '\\b');
                    let lineCode = code[0][0];
                    let lineId = code[0][1];

                    if(lineCode.search(exReg) >= 0) {

                        let  line = PAY_LINES[k][2];
                        if(line == null){
    //                    
                            winnings.push([PAY_LINES[k][0],PAY_LINES[k][3]]);
                            
                        } else {
                            
                            if(line == 1 && screen[0].length == 1) winnings.push([PAY_LINES[k][0],PAY_LINES[k][3]]);
                            if(line == 0 && screen[0].length == 2 && j == 0) winnings.push([PAY_LINES[k][0],PAY_LINES[k][3]]);
                            if(line == 2 && screen[0].length == 2 && j == 1) winnings.push([PAY_LINES[k][0],PAY_LINES[k][3]]);
                            
                        }

                        lightBulbs(lineId);
                    }        
                } 
            }      
        }
        
        //Update player balance
        payWinnings();
        
    }
    
    
    //Light winning line with bulbs
    function lightBulbs(n){
        let machineLights = app.stage.getChildByName("Screen").getChildByName("Machine").getChildByName("LineIdent"); 
        machineLights.getChildByName("identCircl_on_l_" + n).visible = true;
        machineLights.getChildByName("identCircl_on_r_" + n).visible = true;
        

    }
    
    //Disable all bulbs
    function offBulbs(){
        let machineLights = app.stage.getChildByName("Screen").getChildByName("Machine").getChildByName("LineIdent"); 
        for(let i = 0; i < 3; i++){
            machineLights.getChildByName("identCircl_on_l_" + i).visible = false;
            machineLights.getChildByName("identCircl_on_r_" + i).visible = false;
        }
    }
    
    
    //Update player balance with winnings
    function payWinnings(){
        
        for(let i = 0; i < winnings.length; i++){
            
            let chart = app.stage.getChildByName("Screen").getChildByName("Chart").getChildByName("PayLines");  
            PLAYER_BALANCE += winnings[i][1];
            updateBalance(PLAYER_BALANCE);
            highlightsOn(chart.getChildByName(winnings[i][0]).y, i)
        }
    }
    
    //Chart winning combination highlight ON
    function highlightsOn(y, i){
        let highlight = app.stage.getChildByName("Screen").getChildByName("Chart").getChildByName("PayLines").getChildByName("Highlight_" + i);
        highlight.y = y - 5;
        highlight.visible = true;
    }
    
    //Chart winning combination highlight OFF
    function highlightsOff(){
        for(let i = 0; i < 2; i++){
              let highlight = app.stage.getChildByName("Screen").getChildByName("Chart").getChildByName("PayLines").getChildByName("Highlight_" + i);
            highlight.visible = false;  
        }
        
    }
    
    //Set up most graphics
    function setBackgrounds() {
        app.stage.addChild(new Sprite(id["mainbg.png"]));
        
        let labelStyle = new TextStyle({
            fontFamily: "Arial",
            fontSize: 12,
            fill: 0x000000,
            letterSpacing: 0
          });
        
        let screen = new Container();
        screen.name = "Screen";
        screen.x = 39;
        screen.y = 44;
        app.stage.addChild(screen);
        
        let chart = new Container();
        chart.name = "Chart";
        screen.addChild(chart);
        chart.addChild(new Sprite(id["chartBg.png"]));
        
        let linesContainer = new Container();
        linesContainer.name = "PayLines"
        linesContainer.y = 23;
        chart.addChild(linesContainer);
        
        let winHightlight_0 = new Graphics();
        winHightlight_0.name = "Highlight_0"
        winHightlight_0.beginFill(0x00e125);
        winHightlight_0.drawRect(0,0,215,41); 
        winHightlight_0.endFill();
        winHightlight_0.visible = false;
        linesContainer.addChild(winHightlight_0);
        
        let winHightlight_1 = new Graphics();
        winHightlight_1.name = "Highlight_1"
        winHightlight_1.beginFill(0x00e125);
        winHightlight_1.drawRect(0,0,215,41); 
        winHightlight_1.endFill();
        winHightlight_1.visible = false;
        linesContainer.addChild(winHightlight_1);
        
        for(let i = 0; i < PAY_LINES_LINK.length; i++){
            
            let payLine = new Sprite(id[PAY_LINES_LINK[i] + "_chart.png"]);
            payLine.name = PAY_LINES_LINK[i];
            payLine.x = 26;
            payLine.y = 41 * i;
            linesContainer.addChild(payLine);
            
        }
        
        let machine = new Container();
        machine.name = "Machine";
        machine.x = chart.width + 33;
        screen.addChild(machine);
        machine.addChild(new Sprite(id["Machine_bg.png"]));
        
        let lineIdentCon = new Container();
        lineIdentCon.name = "LineIdent"
        lineIdentCon.y = 50;
        machine.addChild(lineIdentCon);
        
        for(let g = 0; g < 3; g++){
            let circl_l = new Graphics();
            circl_l.name = "identCircl_off_l_" + g;
            circl_l.y = 58 * g + 35;
            circl_l.beginFill(0x000000);
            circl_l.drawCircle(10, 0, 6);
            circl_l.endFill();
            lineIdentCon.addChild(circl_l);
            
            let circl_r = new Graphics();
            circl_r.name = "identCircl_off_r_" + g;
            circl_r.x = 450;
            circl_r.y = 58 * g + 35;
            circl_r.beginFill(0x000000);
            circl_r.drawCircle(10, 0, 6);
            circl_r.endFill();
            lineIdentCon.addChild(circl_r);
            
            let circl_l_on = new Graphics();
            circl_l_on.name = "identCircl_on_l_" + g;
            circl_l_on.y = 58 * g + 35;
            circl_l_on.beginFill(0x00e125);
            circl_l_on.drawCircle(10, 0, 6);
            circl_l_on.endFill();
            circl_l_on.visible = false;
            lineIdentCon.addChild(circl_l_on);
            
            let circl_r_on = new Graphics();
            circl_r_on.name = "identCircl_on_r_" + g;
            circl_r_on.x = 450;
            circl_r_on.y = 58 * g + 35;
            circl_r_on.beginFill(0x00e125);
            circl_r_on.drawCircle(10, 0, 6);
            circl_r_on.endFill();
            circl_r_on.visible = false;
            lineIdentCon.addChild(circl_r_on);
        }
        
        let reelScreen = new Container();
        reelScreen.addChild(new Sprite(id["screenBack.png"]));
        reelScreen.x = 27;
        reelScreen.y = 38;
        machine.addChild(reelScreen);
        
        
        let button = new Container();
        button.name = "Button";
        button.buttonMode = true;
        button.interactive = true;
        button.on('click', startPlay);
        machine.addChild(button);
        
        let buttonOff = new Sprite(id["LEt’S ROLL!.png"]);
        buttonOff.name = "ButtonOff"
        buttonOff.visible = true;
        button.addChild(buttonOff);
        
        let buttonOn = new Sprite(id["LEt’S ROLL_Running.png"]);
        buttonOn.name = "ButtonOn";
        buttonOn.visible = false;
        button.addChild(buttonOn);
        
        button.x = machine.width/2 - button.width/2;
        button.y = 321;
        
        let oneCoin = new Sprite(id["1Coin.png"]);
        oneCoin.x = machine.width/2 - oneCoin.width/2;
        oneCoin.y = machine.height - 30;
        machine.addChild(oneCoin);
        
        
        let balanceScreen = new Container();
        balanceScreen.name = "Balance"
        balanceScreen.x = machine.width/2 - 59/2;
        balanceScreen.y = 278;
        machine.addChild(balanceScreen);
        
        let balanceBg = new Graphics();
        balanceBg.beginFill(0x5f5c5c);
        balanceBg.drawRect(0,0,59,20); 
        balanceBg.endFill();
        balanceScreen.addChild(balanceBg);
        
        let balanceText = new Text(PLAYER_BALANCE, FONT_STYLE);
        balanceText.name = "Text"
        balanceText.x = 5;
        balanceScreen.addChild(balanceText);
            
        let mask = new Graphics();
        mask.drawRect(326, 83, 394, 202);
        mask.renderable = true;
        mask.cacheAsBitmap = true;
        app.stage.addChild(mask);
        
        reelsContainer = new Container();
        reelsContainer.x = 21;
        reelsContainer.y = 42;
        reelsContainer.mask = mask;
        reelScreen.addChild(reelsContainer);
        
        
        let debugScreen = new Container();
        debugScreen.name = "DebugScreen"
        debugScreen.width = 300;
        debugScreen.height = 240;
        debugScreen.visible = false;
        debugScreen.x = app.stage.width/2 - 150;
        debugScreen.y = app.stage.height/2 - 100;
        
        let debugBg = new Graphics();
        debugBg.beginFill(0xdfe2e0);
        debugBg.drawRect(0,0,300,240);
        debugBg.endFill();
        debugScreen.addChild(debugBg);
        app.stage.addChild(debugScreen);
        
        
        let debugIcon = new Text("Debug", labelStyle);
        debugIcon.x = machine.width - 50;
        debugIcon.y = 10;
        debugIcon.buttonMode = true;
        debugIcon.interactive = true;
        debugIcon.on('click', openDebugSettings);
        machine.addChild(debugIcon);
        
        let enterBalanceLabel = new Text("Enter Balance", labelStyle);
        enterBalanceLabel.x = 20;
        enterBalanceLabel.y = 5;
        debugScreen.addChild(enterBalanceLabel);
        
        let enterBalance = new PixiTextInput(PLAYER_BALANCE);
        enterBalance.name = "EnterBalance";
        enterBalance.x = 20;
        enterBalance.y = 20;
        debugScreen.addChild(enterBalance);
        
        let debugSwich = new Container();
        debugSwich.name = "DebugSwich";
        debugSwich.x = 150;
        debugSwich.y = 20;
        debugSwich.buttonMode = true;
        debugSwich.interactive = true;
        debugSwich.on('click', toggleDebug);
        debugScreen.addChild(debugSwich);
        
        let debugSwichLabel = new Text("Debug On/Off", labelStyle);
        debugSwichLabel.x = debugSwich.x;
        debugSwichLabel.y = 5;
        
        debugScreen.addChild(debugSwichLabel);
        
        let indOn = new Graphics();
        indOn.name = "on";
        indOn.beginFill(0x0caa26);
        indOn.drawRect(0,0,30,30);
        indOn.endFill();
        indOn.visible = false;
        debugSwich.addChild(indOn);
        
        let indOff = new Graphics();
        indOff.name = "off";
        indOff.beginFill(0xb91919);
        indOff.drawRect(0,0,30,30);
        indOff.endFill();
        debugSwich.addChild(indOff);
        
        let exitButton = new Container();
        exitButton.x = debugScreen.width - 15;
        exitButton.y = 5;
        exitButton.width = 10;
        exitButton.height = 10;
        exitButton.buttonMode = true;
        exitButton.interactive = true;
        exitButton.on('click', applySettings);
        debugScreen.addChild(exitButton);
        
        let exitIco = new Graphics();
        exitIco.name = "off";
        exitIco.beginFill(0x151313);
        exitIco.drawRect(0,0,10,10);
        exitIco.endFill();
        exitButton.addChild(exitIco);
        
        
        let screenMap = new Container();
        screenMap.name = "ScreenMap";
        screenMap.x = debugScreen.width/2 - 50;
        screenMap.y = 80;
        debugScreen.addChild(screenMap);
        
        //Draw cols & rows
        screenMap.addChild(new Graphics()
                .beginFill(0xffffff)
                .drawRect(0,0,90,90)
                .endFill()
                .lineStyle(1, 0x000000)
                .moveTo(0,0)
                .lineTo(90,0)
                .lineTo(90,90)
                .lineTo(0,90)
                .lineTo(0,0))
                .moveTo(30,0)
                .lineTo(30,90)
                .moveTo(60,90)
                .lineTo(60,0)
                .moveTo(0, 30)
                .lineTo(90,30)
                .moveTo(90, 60)
                .lineTo(0,60); 
        
        for(let j = 0; j < 3; j++){
            let rowNum = new Text(j,labelStyle);
            rowNum.x = -10;
            rowNum.y = 30 * j + 8;
            screenMap.addChild(rowNum);
            
            let colNum = new Text(j,labelStyle);
            colNum.x = 30 * j + 10;
            colNum.y = -15;
            screenMap.addChild(colNum);
            
            let rowInputLine = new PixiTextInput("0,0",labelStyle);
            rowInputLine.name = "row_" + j;
            rowInputLine.x = 20;
            rowInputLine.y = 30 * j + 88;
            rowInputLine.width = 50;
            debugScreen.addChild(rowInputLine);        
                  
        }
        
        let rowInpLabel = new Text('Enter Pattern', labelStyle);
            rowInpLabel.y = 68;
            rowInpLabel.x = 20;
            debugScreen.addChild(rowInpLabel);
        
        
        
        let metaInfo = new Container();
        metaInfo.x = 20;
        metaInfo.y = 200;
        debugScreen.addChild(metaInfo);
        
        for(let m = 0; m < symbols.length; m++){
            let sm = new Sprite(symbols[m]);
            sm.width = 25;
            sm.height = 25;
            sm.y = 0;
            sm.x = 55 * m;
            metaInfo.addChild(sm);
            
            let t = new Text(m, labelStyle);
            t.y = 5;
            t.x = 55 * m + 30;
            metaInfo.addChild(t);
        }
    }
    
    
    //Shows popup with Debug settings. Updates game settings.
    function openDebugSettings(){
        let debugScreen = app.stage.getChildByName("DebugScreen");
        debugScreen.visible = true;
        DEBUG_SCREEN = true;//Adds event listner for keyups
        updateDebugScreen();
    }
    
    //Create new slot with symbol
    function createSymbol(i){
        
        let relSymbolsStack = symbolsStack();
                
        let symbol = relSymbolsStack[i];
        symbol.y = i * SYMBOL_SIZE - 20;
        symbol.x = 0;
        symbol.width = 113;
        symbol.height = 93;
        return symbol;
    }
    
    //Create collum object. type keeps position (top&bot/center)
    function createCol(container, type){
        let col = {
                container: container,
                offsetY: type
            }
        
        return col;
    }
    
    
    //Container for collum graphics
    function createColContainer(i, offsetYType, firstRun){
        
        let colContainer = new Container();
            colContainer.y = -REEL_LENGTH * SYMBOL_SIZE -20 + SYMBOL_SIZE * 3;
        
            if(firstRun){
                colContainer.y = -20;
            } 
        
            if(offsetYType == 1) colContainer.y -= 64;
            colContainer.x = REEL_WIDTH * i;
        
        return colContainer;
    }
    
    //SPing to Win button with 2 graphics for on and off
    function switchButton(phase){
        let button = app.stage.getChildByName("Screen")
        .getChildByName("Machine")
        .getChildByName("Button");
        
        button.getChildByName("ButtonOn").visible = phase;
        button.getChildByName("ButtonOff").visible = !phase;
    }
    
    //Update balance display
    function updateBalance(amount){
        let balance = app.stage.getChildByName("Screen")
        .getChildByName("Machine")
        .getChildByName("Balance")
        .getChildByName("Text");
        
        balance.text = amount;
    }
    
    //Listen for keyups. Needed on debug screen to validate inputs.
    document.addEventListener('keyup', updateDebugScreen);
    
    //Gather settings. Update mini display.
    function updateDebugScreen(){
        if(!DEBUG_SCREEN) return;
        
        let debugScreen = app.stage.getChildByName("DebugScreen");
        let screenMap = debugScreen.getChildByName("ScreenMap");
        temp_pattern = [];
        
        if(screenMap.getChildByName("Markers") != undefined) screenMap.removeChild(screenMap.getChildByName("Markers"));
        let markersCon = new Container();
        markersCon.name = "Markers";
        screenMap.addChild(markersCon);
        
        for(let i = 0; i < 3; i++){
            let inputCon = debugScreen.getChildByName("row_" + i);
            let text = inputCon.text;
            
            if(text.match(/[a-z]/i)) {
                text = "0,0";
                inputCon.text = text;
            }
            text = text.substring(0,3)
            temp_pattern.push(text.split(","));      
        }
        
            for(let j = 0; j < 3; j++){
               if(temp_pattern[j].length > 1){
                   for(let k = 0; k < 2; k++){
                      let s = new Sprite(symbols[temp_pattern[j][k]]);
                       s.width = 30;
                       s.height = 30;
                       s.x = 30 * j;
                       s.y = (30*2) * k;
                       markersCon.addChild(s);  
                   }
                  
               } else {
                   let s = new Sprite(symbols[temp_pattern[j][0]]);
                       s.width = 30;
                       s.height = 30;
                       s.x = 30 * j;
                       s.y = 30;
                       markersCon.addChild(s); 
               }
            }    
    }
    
    //Settings applied on debugScreen exit. Updat balance. Check for Debug mode.
    function applySettings(){
        let debugScreen = app.stage.getChildByName("DebugScreen");
        debugScreen.visible = false;
        let balanceInput = debugScreen.getChildByName("EnterBalance");
        PLAYER_BALANCE = parseInt(balanceInput.text);
        updateBalance(PLAYER_BALANCE);
        DEBUG_CASE = temp_pattern;
    }
    
    //Toggle debug mode button.
    function toggleDebug(){
        let debugScreen = app.stage.getChildByName("DebugScreen");
        let button = debugScreen.getChildByName("DebugSwich");
        if(DEBUG_MODE) {
            DEBUG_MODE = false;
            button.getChildByName("on").visible = false;
            button.getChildByName("off").visible = true;
        } else {
            DEBUG_MODE = true;
            button.getChildByName("on").visible = true;
            button.getChildByName("off").visible = false;
        }
        
    }
    
    
}