/*

Ships
Version: 0.1
ClientSide-Version
app.js

*/


const chars = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "R", "S", "T", "U", "W", "Y", "Z"];
const ships = ["X", "XX", "XXX", "XXXX"];
var myShipCords = [];
var myShipCounts = [0,0,0,0];
var myAttacksCords = [];
var myTrueAttacksCords = [];
var enemyShots = [];
var trueEnemyShots = [];
var languagePack = [];
var lastID = [];

var gameStatus = "0";
var selectedShip = null;
var pingEnded = false;
var rotated = false;
var blocked = false;
var myTurn = false;
var searchingGame = false;
var awaitingForHost = false;
var errorShowed = false;
var corners = false;

var hoverElement = null;
var hoverBool = null;
var isOverlayAnimating = false;
var maxoverlayScreenOpacity = 0.3;
var preloadedCode = '';
var isAwaiting = false;
var gameEnded = false;
var awaitingForHostI = null;

var mapWidth = 10;
var mapHeight = 10;

var callback = document.getElementById("callback");

loadLanguage();
generateMap(mapWidth, mapHeight, 'map');
generateMap(mapWidth, mapHeight, 'enemy');
generateShips();
checkPlayer();

var update = setInterval(function() {
    for(var i = 0; i < myShipCords.length; i++)
    {
        document.getElementById(myShipCords[i]).innerHTML = 'X';
        document.getElementById(myShipCords[i]).style.backgroundColor = 'blue';
    }
    for(var i = 0; i < myAttacksCords.length; i++)
    {
        document.getElementById(myAttacksCords[i]).innerHTML = 'O';
        document.getElementById(myAttacksCords[i]).style.backgroundColor = "red";
    }
    for(var i = 0; i < myTrueAttacksCords.length; i++)
    {
        document.getElementById(myTrueAttacksCords[i]).innerHTML = 'X';
        document.getElementById(myTrueAttacksCords[i]).style.backgroundColor = "green";
    }
    for(var i = 0; i < enemyShots.length; i++)
    {
        document.getElementById(enemyShots[i]).innerHTML = 'O';
        document.getElementById(enemyShots[i]).style.backgroundColor = "green";
    }
    for(var i = 0; i < trueEnemyShots.length; i++)
    {
        document.getElementById(trueEnemyShots[i]).innerHTML = 'X';
        document.getElementById(trueEnemyShots[i]).style.backgroundColor = "red";
    }
    if(blocked)
    {
        for(var i = 0; i < lastID.length; i++)
        {
            if(document.body.contains(document.getElementById(lastID[i]))) document.getElementById(lastID[i]).style.backgroundColor = "red";
        }
    }
    if(!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    {
        if(window.innerWidth < 892 || window.innerHeight < 685)
        {
            document.getElementById("tooSmallScreen").style.display = "flex";
        } else {
            document.getElementById("tooSmallScreen").style.display = "none";
        }
    }
}, 100);

function loadLanguage()
{
    $.ajax({ type: "GET",   
        url: "game_handler.php?type=GetLanguagePack",   
        async: false,
        xhrFields: { withCredentials: true },
        success : function(text)
        {
            result = text;
            var json = JSON.parse(result);
            languagePack = [];
            if(json.Error == "1")
            {
                loadOverlayContent("error");
                return;
            } else {
                languagePack = json.LanguagePack;
            }
        }
    });
}

function generateMap(x, y, elementid)
{
    var Map = document.getElementById(elementid);
    Map.innerHTML = "";
    Map.innerHTML = '<table align="center" cellspacing=0><tr><th> </th></tr>';
    var MapInside = Map.children[0].children[0];
    for(var i = 1; i <= x; i++)
    {
        MapInside.children[0].innerHTML = MapInside.children[0].innerHTML + '<th>' + chars[i-1] + '</th>';
    }
    for(var i = 1; i <= y; i++)
    {
        MapInside.innerHTML = MapInside.innerHTML + '<tr><th>' + i + '</th></tr>';
    }
    var insideid = 0;
    var functionName = "";
    if(elementid == "map")
    {
        functionName = "placeShip";
    } else {
        functionName = "attack";
    }
    for(var i = 1; i <= y; i++)
    {
        for(j = 1; j <= x; j++)
        {
            MapInside.children[i].innerHTML = MapInside.children[i].innerHTML + '<td class="mapElement" insideid="' + insideid + '" parent="' + elementid + '" cordX="' + j +'" cordY="' + i+ '" id="' + elementid + '_x' + j + 'y' + i + '" onclick="' + functionName + '(this)" onmouseover="hoverMapElement(this, true)" oncontextmenu="rotateShip(); return false;" onmouseout="hoverMapElement(this, false)"> </td>';
            insideid++;
        }
    }
}

function hoverMapElement(el, b)
{
    hoverElement = el;
    hoverBool = b;
    blocked = false;
    if(b)
    {
        el.style.backgroundColor = "yellow";
    } else {
        el.style.backgroundColor = "white";
    }
    if(selectedShip != null)
    {
        var x = el.getAttribute("cordX");
        var y = el.getAttribute("cordY");
        var p = el.getAttribute("parent");
        if(p == "map")
        {
            if(myShipCounts[selectedShip] == 4-selectedShip)
            {
                blocked = true;
            }
            if(lastID.length > 0)
            {
                for(var i = 0; i < lastID.length; i++)
                {
                    if(document.body.contains(document.getElementById(lastID[i])))
                    {
                        document.getElementById(lastID[i]).innerHTML = " ";
                        document.getElementById(lastID[i]).style.backgroundColor = "white";
                    }
                }
            }
            lastID = [];
            for(var i = 0; i < ships[selectedShip].length; i++)
            {
                var dX = x;
                var dY = y;
                if(document.body.contains(document.getElementById(p + "_x" + x + "y" + y))) 
                {
                    document.getElementById(p + "_x" + x + "y" + y).innerHTML = "X";
                    document.getElementById(p + "_x" + x + "y" + y).style.backgroundColor = "yellow";
                }
                lastID.push(p + "_x" + x + "y" + y);
                var o = checkForOtherShips(x, y, p);
                if(rotated)
                {
                    if(y > mapHeight)
                    {
                        y--;
                        dY--;
                        blocked = true;
                    } else {
                        y++;
                    }
                } else {
                    if(x > mapWidth)
                    {
                        x--;
                        dX--;
                        blocked = true;
                    } else {
                        x++;
                    }
                }
                if(o)
                {
                    blocked = true;
                }
            }
        }
    } else {
        var x = el.getAttribute("cordX");
        var y = el.getAttribute("cordY");
        var p = el.getAttribute("parent");
        if(lastID.length > 0)
        {
            for(var i = 0; i < lastID.length; i++)
            {
                if(document.body.contains(document.getElementById(lastID[i])))
                {
                    document.getElementById(lastID[i]).innerHTML = " ";
                    document.getElementById(lastID[i]).style.backgroundColor = "white";
                }
            }
        }
        for(var i = 0; i < myAttacksCords.length; i++)
        {
            if(el.id == myAttacksCords[i])
            {
                blocked = true;
            }
        }
        lastID = [p + "_x" + x + "y" + y];
    }
}

function rotateShip()
{
    rotated = !rotated;
    hoverMapElement(hoverElement, hoverBool);
}

function checkForOtherShips(x, y, p)
{
    for(var i = 0; i < myShipCords.length; i++)
    {
        if(myShipCords[i] == p + "_" + "x" + x + "y" + y) { blocked = true; return true; }
        var x2 = parseInt(x)+1;
        if(myShipCords[i] == p + "_" + "x" + x2 + "y" + y) { blocked = true; return true; }
        if(myShipCords[i] == p + "_" + "x" + (parseInt(x)-1) + "y" + y) { blocked = true; return true; }
        var y2 = parseInt(y)+1;
        if(myShipCords[i] == p + "_" + "x" + x + "y" + y2) { blocked = true; return true; }
        if(myShipCords[i] == p + "_" + "x" + x + "y" + (parseInt(y)-1)) { blocked = true; return true; }
        if(!corners)
        {
            if(myShipCords[i] == p + "_" + "x" + (parseInt(x)-1) + "y" + (parseInt(y)-1)) { blocked = true; return true; }
            var x2 = parseInt(x)+1;
            if(myShipCords[i] == p + "_" + "x" + x2 + "y" + (parseInt(y)-1)) { blocked = true; return true; }
            var y2 = parseInt(y)+1;
            if(myShipCords[i] == p + "_" + "x" + (parseInt(x)-1) + "y" + y2) { blocked = true; return true; }
            var x2 = parseInt(x)+1;
            var y2 = parseInt(y)+1;
            if(myShipCords[i] == p + "_" + "x" + x2 + "y" + y2) { blocked = true; return true; }
        }
    }
    return false;
}

function attack(el)
{
    if(myTurn)
    {
        for(var i = 0; i < myAttacksCords.length; i++)
        {
            if(el.id == myAttacksCords[i])
            {
                blocked = true;
                return;
            }
        }
        var x = el.getAttribute("cordX");
        var y = el.getAttribute("cordY");
        var p = el.getAttribute("parent");
        myAttacksCords.push(p + "_x" + x + "y" +  y);
        $.ajax({ type: "GET",   
            url: "game_handler.php?type=Attack&cordX=" + x + "&cordY=" + y,   
            async: false,
            xhrFields: { withCredentials: true },
            success : function(text)
            {
                result = text;
                var json = JSON.parse(result);
                if(json.Error == "1")
                {
                    loadOverlayContent("error");
                    return;
                } else {
                    if(json.Hit == "1")
                    {
                        myTurn = true;
                        myTrueAttacksCords.push(p + "_x" + x + "y" + y);
                    } else {
                        myTurn = false;
                    }
                }
            }
        });
    }
}

function placeShip(el)
{
    if(!blocked && selectedShip != null)
    {
        for(var i = 0; i < lastID.length; i++)
        {
            myShipCords.push(lastID[i]);
        }
        myShipCounts[selectedShip] += 1;
        document.getElementById("shipSelectCount" + selectedShip).innerHTML = 4-selectedShip-myShipCounts[selectedShip] + "x";
        if(myShipCounts[selectedShip] == 4-selectedShip)
        {
            selectShip(selectedShip);
        }
        var result = '';
        var extData = 'rotated=' + rotated + '&';
        for(var i = 0; i < lastID.length; i++)
        {
            var p = el.getAttribute("parent");
            var e = document.getElementById(lastID[i]);
            var x = e.getAttribute("cordX");
            var y = e.getAttribute("cordY");
            extData = extData + "x" + i + "=" + x + "&y" + i + "=" + y + "&";
        }
        extData = extData + "cordsCount=" + lastID.length;
        $.ajax({ type: "GET",   
            url: 'game_handler.php?type=PlaceShip&' + extData,
            async: true,
            xhrFields: { withCredentials: true },
            success : function(text)
            {
                result = text;
                var json = JSON.parse(result);
                if(json.CanPlace != "1" || json.Error == "1")
                {
                    loadOverlayContent("error");
                }
            }
        });
    }
}

function generateShips()
{
    var shipsrow = document.getElementById('ships');
    var num = 4;
    for(var i = 0; i < ships.length; i++)
    {
        shipsrow.innerHTML = shipsrow.innerHTML + '<table cellspacing=0 class="Ship" id="shiprow_' + i + '" onclick="selectShip(' + i + ', this)"><tbody>';
        var OutputShip = ships[i].split('');
        var Output = '<tr><td id="shipSelectCount' + i + '">' + num + 'x</td>';
        for(var j = 0; j < OutputShip.length; j++)
        {
            Output = Output + '<td>' + OutputShip[j] + '</td>';
        }
        Output = Output + "</tbody></table>";
        shipsrow.children[i].children[0].innerHTML = shipsrow.children[i].children[0].innerHTML + Output;
        num--;
    }
    $.ajax({ type: "GET",   
        url: 'game_handler.php?type=CheckPlayer',
        async: true,
        xhrFields: { withCredentials: true },
        success : function(text)
        {
            result = text;
            var json = JSON.parse(result);
            if(json.InGame != "NotSet")
            {
                $.ajax({ type: "GET",   
                    url: 'game_handler.php?type=GetMyShips',
                    async: true,
                    xhrFields: { withCredentials: true },
                    success : function(text)
                    {
                        var json = JSON.parse(text);
                        for(var i = 0; i < json.MyShips.length; i++)
                        {
                            myShipCords.push(json.MyShips[i]);
                        }
                        $.ajax({ type: "GET",   
                            url: 'game_handler.php?type=GetMyShipCount',
                            async: true,
                            xhrFields: { withCredentials: true },
                            success : function(text)
                            {
                                var json = JSON.parse(text);
                                var j = 4;
                                for(var i = 0; i < 4; i++)
                                {
                                    document.getElementById("shipSelectCount" + i).innerHTML = (j-parseInt(json.MyShipCount[i])) + "x";
                                    myShipCounts[i] = parseInt(json.MyShipCount[i]);
                                    j--;
                                }
                            }
                        });
                    }
                });
            }
        }
    });
}

function selectShip(shipID, element)
{
    for(var i = 0; i < ships.length; i++)
    {
        document.getElementById("shiprow_" + i).style.border = "0px";
    }
    if(selectedShip != shipID)
    {
        selectedShip = shipID;
        if(myShipCounts[selectedShip] == 4-selectedShip)
        {
            selectedShip = null;
        } else {
            element.style.border = "3px solid red";
        }
    } else {
        selectedShip = null;
    }
    if(lastID.length > 0)
    {
        for(var i = 0; i < lastID.length; i++)
        {
            if(document.body.contains(document.getElementById(lastID[i])))
            {
                document.getElementById(lastID[i]).innerHTML = " ";
                document.getElementById(lastID[i]).style.backgroundColor = "white";
                blocked = false;
            }
        }
    }
}

function checkForGame()
{
    if(searchingGame) return;
    var input = document.getElementById('gameID');
    var gameCallback = document.getElementById("gameIDcallback");
    var val = input.value;
    if(val.length == 0)
    {
        input.setAttribute("class", "form-control");
        gameCallback.innerHTML = '<span id="searchForOpenedGames" onClick="searchOpenedGames()">Kliknij tutaj, aby szukać otwartych gier.</span>';
        return;
    }
    if(val.length != 5)
    {
        input.setAttribute("class", "form-control is-invalid");
        gameCallback.innerHTML = "Kod gry jest nieprawidłowy";
    } else {
        val = parseInt(val);
        input.setAttribute("class", "form-control");
        gameCallback.innerHTML = "Trwa uzyskiwanie informacji o grze..";
        $.ajax({ type: "GET",   
            url: 'game_handler.php?type=CheckGame&value=' + val,
            async: true,
            xhrFields: { withCredentials: true },
            success : function(text)
            {
                result = text;
                var json = JSON.parse(result);
                if(json.GameFound == "0")
                {
                    input.setAttribute("class", "form-control is-invalid");
                    gameCallback.innerHTML = "Nie znaleziono gry z tym kodem";
                } else {
                    gameCallback.innerHTML = joinCallCode(json.Status, input);
                }
            }
        });
    }
}

function joinGame()
{
    var input = document.getElementById('gameID');
    var gameCallback = document.getElementById("gameIDcallback");
    var val = input.value;
    if(val.length != 5)
    {
        input.setAttribute("class", "form-control is-invalid");
        gameCallback.innerHTML = "Kod gry jest nieprawidłowy";
    } else {
        val = parseInt(val);
        input.setAttribute("class", "form-control");
        gameCallback.innerHTML = "Trwa uzyskiwanie informacji o grze..";
        $.ajax({ type: "GET",   
            url: 'game_handler.php?type=CheckGame&value=' + val,
            async: true,
            xhrFields: { withCredentials: true },
            success : function(text)
            {
                result = text;
                var json = JSON.parse(result);
                if(json.Status == "0")
                {
                    input.setAttribute("class", "form-control is-valid");
                    gameCallback.innerHTML = "Trwa dołączanie do gry..";
                    $.ajax({ type: "GET",   
                        url: 'game_handler.php?type=JoinGame&value=' + val,
                        async: true,
                        xhrFields: { withCredentials: true },
                        success : function(text)
                        {
                            result = text;
                            var json = JSON.parse(result);
                            if(json.Joined == "1")
                            {
                                input.setAttribute("class", "form-control is-valid");
                                gameCallback.innerHTML = "Dołączono!";
                                overlay(false);
                                document.getElementById("exit").style.display = "block";
                                listenToGame();
                            } else {
                                gameCallback.innerHTML = "Nie można dołączyć do tej gry..";
                                input.setAttribute("class", "form-control is-invalid");
                            }
                        }
                    });
                } else {
                    if(json.GameFound == "0")
                    {
                        input.setAttribute("class", "form-control is-invalid");
                        gameCallback.innerHTML = "Nie znaleziono gry z tym kodem";
                    } else {
                        gameCallback.innerHTML = joinCallCode(json.Status, input);
                        input.setAttribute("class", "form-control is-invalid");
                    }
                }
            }
        });
    }
}

function joinCallCode(status, input)
{
    if(status == "0")
    {
        if(input != null) input.setAttribute("class", "form-control is-valid");
        return "Znaleziono grę z tym kodem. Liczba graczy: <font color='green'><b>1/2</b></font>. Gotowość do dołączenia!";
    }
    if(status == "1")
    {
        if(input != null) input.setAttribute("class", "form-control is-invalid");
        return "Znaleziono grę z tym kodem. Liczba graczy: <font color='red'><b>2/2</b></font>. Nie można dołączyć do tej gry.";
    }
    if(status == "-1")
    {
        if(input != null) input.setAttribute("class", "form-control is-invalid");
        return "Ta gra dobiegła końca.";
    }
    if(status == "-2")
    {
        if(input != null) input.setAttribute("class", "form-control is-invalid");
        return "Ta gra dobiegła końca i została oddana walkoverem.";
    } else {
        if(input != null) input.setAttribute("class", "form-control is-invalid");
        return "Znaleziono grę z tym kodem. Nie można dołączyć do tej gry; trwa obecnie rozgrywka.";
    }
}

function overlay(bool)
{
    if(isOverlayAnimating) return;
    isOverlayAnimating = true;
    var overlayScreen = document.getElementById("overlay");
    var overlayTable = document.getElementById("overlay_table");
    overlayScreen.style.display = "flex";
    overlayTable.style.display = "flex";
    if(bool)
    {
        var a = 0;
        var t = setInterval(function(){
            if(a >= 1)
            {
                isOverlayAnimating = false;
                clearInterval(t);
                return;
            } else {
                a += 0.01;
                if(a < maxoverlayScreenOpacity) overlayScreen.style.opacity = a;
                overlayTable.style.opacity = a;
            }
        }, 10)
    } else {
        var a = 1;
        var b = 0.3;
        var t = setInterval(function(){
            if(a <= 0)
            {
                isOverlayAnimating = false;
                overlayScreen.style.display = "none";
                overlayTable.style.display = "none";
                clearInterval(t);
                return;
            } else {
                a -= 0.01;
                b -= 0.01;
                if(b > 0) overlayScreen.style.opacity = b;
                overlayTable.style.opacity = a;
            }
        }, 10)
    }
}

function loadOverlayContent(typeOfContent, args)
{
    if(typeOfContent == "none")
    {
        document.getElementById("overlay_content").innerHTML = '';
    }
    if(typeOfContent == "join")
    {
        document.getElementById("overlay_content").innerHTML = '<p id="title">Dołącz do gry</p><div id="gameList"></div><form id="gameCode" action="javascript:void(0);" autocomplete="off"><fieldset><br><div class="formcontent"><div class="form-floating"><input class="form-control" type="text" name="gameID" id="gameID" oninput="checkForGame();" value="' + preloadedCode + '" placeholder="Kod gry" maxlength=5 minlength=5 required><label for="gameID">Kod gry: </label></div><br><input class="form-control" type="submit" value="Dołącz do gry" onclick="joinGame()"><br><p id="gameIDcallback"></p></div></fieldset></form>';
        searchOpenedGames();
    }
    if(typeOfContent == "joinold")
    {
        document.getElementById("overlay_content").innerHTML = '<p id="title">Dołącz do gry</p><form action="javascript:void(0);" autocomplete="off"><fieldset><br><div class="formcontent"><div class="form-floating"><input class="form-control" type="text" name="gameID" id="gameID" oninput="checkForGame();" value="' + preloadedCode + '" placeholder="Kod gry" maxlength=5 minlength=5 required><label for="gameID">Kod gry: </label></div><br><input class="form-control" type="submit" value="Dołącz do gry" onclick="joinGame()"><br><p id="gameIDcallback"><span id="searchForOpenedGames" onClick="searchOpenedGames()">Kliknij tutaj, aby szukać otwartych gier.</span></p></div></fieldset></form>';
    }
    if(typeOfContent == "host")
    {
        isAwaiting = true;
        document.getElementById("overlay_content").innerHTML = '<p id="title">Stworzono grę</p><p>Kod gry: ' + args.GameID + '</p><form class="form-control"><div class="form-check form-switch"><input type="checkbox" checked=0 class="form-check-input" id="gameOpened" onChange="switchSettings(0, `gameOpened`)"><label class="form-check-label" for="gameOpened">Wybierz, czy gra ma być otwarta</label></div><div class="form-check form-switch"><input type="checkbox" checked=0 class="form-check-input" id="shipCorners" onChange="switchSettings(1, `shipCorners`)"><label class="form-check-label" for="shipCorners">Wybierz, czy statki mogą stykać się rogami</label></div></form><br><p id="hostGameStatus"></p>';
        document.getElementById("gameOpened").checked = 0;
        document.getElementById("shipCorners").checked = 0;
        var t = setInterval(function() {
            $.ajax({ type: "GET",   
                url: 'game_handler.php?type=CheckGame&source=Host',
                async: true,
                xhrFields: { withCredentials: true },
                success : function(text)
                {
                    result = text;
                    var json = JSON.parse(result);
                    if(json.SourceHost != "1" || json.isHost != "1")
                    {
                        loadOverlayContent("error");
                        clearInterval(t);
                        return;
                    }
                    document.getElementById("gameOpened").checked = parseInt(json.GameOpened);
                    document.getElementById("shipCorners").checked = parseInt(json.Corners);
                    if(json.Status == "1")
                    {
                        document.getElementById("hostGameStatus").innerHTML = 'Status: <font color="orange"><b>Trwa rozpoczynanie rozgrywki..</b></font>';
                        overlay(false);
                        checkPlayer();
                        clearInterval(t);
                    } else {
                        document.getElementById("hostGameStatus").innerHTML = 'Status: <font color="green"><b>Trwa oczekiwanie na graczy..</b></font>';
                    }
                }
            });
        }, 1000);
    }
    if(typeOfContent == "error")
    {
        errorShowed = true;
        overlay(true);
        document.getElementById("overlay_content").innerHTML = '<p id="title">Wystąpił błąd</p><p>Wystąpił błąd podczas komunikacji z serwerem. Najprawdopodobniej niektóre dane nie zgadzają się ze sobą. Spróbuj odświeżyć stronę lub wyjść z gry, a jeżeli problem nadal będzie się powtarzał, skontaktuj się z administratorem strony.</p>';
    }
    if(typeOfContent == "summary")
    {
        var add = "";
        if(args[1])
        {
            add = "Wygrałeś.";
        } else {
            add = "Przegrałeś.";
        }
        document.getElementById("overlay_content").innerHTML = '<p id="title">Gra dobiegła końca</p><p>' + add + '</p>';
        gameEnded = true;
    }
}

function checkPlayer()
{
    $.ajax({ type: "GET",   
        url: 'game_handler.php?type=CheckPlayer',
        async: true,
        xhrFields: { withCredentials: true },
        success : function(text)
        {
            result = text;
            var json = JSON.parse(result);
            if(json.InGame == "NotSet")
            {
                overlay(true);
                loadOverlayContent("join");
            } else {
                if(json.isAwaiting != "NotSet" && json.isAwaiting != "0")
                {
                    overlay(true);
                    if(json.isHost == "1") loadOverlayContent("host", json);
                } else {
                    overlay(false);
                    listenToGame();
                    loadOverlayContent("none");
                    document.getElementById("exit").style.display = "block";
                }
            }
            return json.InGame;
        }
    });
}

function leaveGame()
{
    if(errorShowed)
    {
        window.location.reload();
        return;
    }
    $.ajax({ type: "GET",   
        url: 'game_handler.php?type=LeaveGame',
        async: true,
        xhrFields: { withCredentials: true },
        success : function(text)
        {
            window.location.reload();    
        }
    });
}

function createGame()
{
    if(gameEnded)
    {
        window.location.reload();
        return;
    }
    $.ajax({ type: "GET",   
        url: 'game_handler.php?type=CreateGame',
        async: true,
        xhrFields: { withCredentials: true },
        success : function(text)
        {
            result = text;
            var json = JSON.parse(result);
            if(json.Error != "1") loadOverlayContent("host", json);
        }
    });
}

function listenToGame()
{
    checkShots();
    var t = setInterval(function() {
        checkPing();
        $.ajax({ type: "GET",   
            url: 'game_handler.php?type=CheckGame',
            async: true,
            xhrFields: { withCredentials: true },
            success : function(text)
            {
                pingEnded = true;
                result = text;
                var json = JSON.parse(result);
                gameStatus = json.Status;
                if(json.Corners == "1")
                {
                    corners = true;
                } else {
                    corners = false;
                }
                if(json.Status == "-2")
                {
                    overlay(true);
                    loadOverlayContent("summary", [json.Status, true]);
                    $.ajax({ type: "GET",   
                        url: 'game_handler.php?type=LeaveGame',
                        async: true,
                        xhrFields: { withCredentials: true },
                        success : function(text)
                        {
                            document.getElementById("exit").style.display = "none";
                            clearInterval(t);
                        }
                    });
                }
                if(json.Status == "-1")
                {
                    overlay(true);
                    loadOverlayContent("summary", json.Status);
                    $.ajax({ type: "GET",   
                        url: 'game_handler.php?type=LeaveGame',
                        async: true,
                        xhrFields: { withCredentials: true },
                        success : function(text)
                        {
                            document.getElementById("exit").style.display = "none";
                            clearInterval(t);
                        }
                    });
                }
                if(json.Status == "1")
                {
                    if(!awaitingForHost)
                    {
                        awaitingForHost = true;
                        callback.innerHTML = "Oczekiwanie na hosta..";
                        var time = 0;
                        awaitingForHostI = setInterval(function() {
                            time++;
                            callback.innerHTML = "Oczekiwanie na hosta (Pozostało: " + (25-time) + " sekund)..";
                            if(time >= 25)
                            {
                                awaitingForHost = false;
                                leaveGame();
                            }
                        }, 1000);
                    }
                } else {
                    if(awaitingForHost) clearInterval(awaitingForHostI);
                }
                if(json.Status == "2")
                {
                    callback.innerHTML = "Umieść swoje statki na planszy poniżej.";
                    var count = 0;
                    for(var i = 0; i < 4; i++)
                    {
                        count += myShipCounts[i];
                    }
                    if(count == 10)
                    {
                        callback.innerHTML = "Oczekiwanie na przeciwnika..";
                    }
                }
                if(json.Status == "3")
                {
                    if(json.isHost == "1")
                    {
                        callback.innerHTML = "Zaatakuj przeciwnika używając planszy po prawej stronie.";
                        myTurn = true;
                    } else {
                        callback.innerHTML = "Oczekiwanie, aż przeciwnik zaatakuje..";
                        myTurn = false;
                    }
                }
                if(json.Status == "4")
                {
                    if(json.isHost != "1")
                    {
                        callback.innerHTML = "Zaatakuj przeciwnika używając planszy po prawej stronie.";
                        myTurn = true;
                    } else {
                        callback.innerHTML = "Oczekiwanie, aż przeciwnik zaatakuje..";
                        myTurn = false;
                    }
                }
            }
        });
    }, 1000);
}

function checkShots()
{
    var t = setInterval(function()
    {
        if(gameStatus == "3" || gameStatus == "4")
        {
            $.ajax({ type: "GET",   
                url: 'game_handler.php?type=GetEnemyShots',
                async: true,
                xhrFields: { withCredentials: true },
                success : function(text)
                {
                    var json = JSON.parse(text);
                    for(var i = 0; i < json.Shots.length; i++)
                    {
                        if(!enemyShots.includes(json.Shots[i])) enemyShots.push(json.Shots[i]);
                    }
                    for(var i = 0; i < json.TrueShots.length; i++)
                    {
                        if(!trueEnemyShots.includes(json.TrueShots[i])) trueEnemyShots.push(json.TrueShots[i]);
                    }
                }
            });
            $.ajax({ type: "GET",   
                url: 'game_handler.php?type=GetMyShots',
                async: true,
                xhrFields: { withCredentials: true },
                success : function(text)
                {
                    var json = JSON.parse(text);
                    myAttacksCords = [];
                    myTrueAttacksCords = [];
                    for(var i = 0; i < json.Shots.length; i++)
                    {
                        myAttacksCords.push(json.Shots[i]);
                    }
                    for(var i = 0; i < json.TrueShots.length; i++)
                    {
                        myTrueAttacksCords.push(json.TrueShots[i]);
                    }
                }
            });
        }
    }, 500);
}

function checkPing()
{
    var ping = 0;
    pingEnded = false;
    var t = setInterval(function() {
        ping++;
        if(pingEnded)
        {
            var clr = "green";
            if(ping > 150) clr = "orange";
            if(ping > 200) clr = "red";
            document.getElementById("ping").innerHTML = "Ping: <font color='" + clr + "'>" + ping + "ms</font>";
            clearInterval(t);
        }
    }, 1);
}

function switchSettings(settingType, elementID)
{
    $.ajax({ type: "GET",   
        url: 'game_handler.php?type=SwitchSettings&setting=' + settingType,
        async: true,
        xhrFields: { withCredentials: true },
        success : function(text)
        {
            result = text;
            var json = JSON.parse(result);
            if(json.Error == "1")
            {
                loadOverlayContent("error");
            } else {
                document.getElementById(elementID).checked = json.SwitchValue;
            }
        }
    });
}

function searchOpenedGames()
{
    if(searchingGame) return;
    var gameList = document.getElementById("gameList");
    searchingGame = true;
    gameList.innerHTML = "Trwa wyszukiwanie otwartych gier..";
    $.ajax({ type: "GET",   
        url: 'game_handler.php?type=SearchForOpenedGames',
        async: true,
        xhrFields: { withCredentials: true },
        success : function(text)
        {
            result = text;
            var json = JSON.parse(result);
            searchingGame = false;
            if(json.NumOfGames > 0)
            {
                var gameListContent = "<table><tr><th>Kod gry</th><th>Stykanie się rogami</th><th>Akcja</th></tr>";
                for(var i = 0; i < json.NumOfGames; i++)
                {
                    var corner = "❌";
                    if(json.CornerInfo[i] == "1")
                    {
                        corner = "✔️";
                    }
                    gameListContent = gameListContent + "<tr><td>" + json.FoundGames[i] + "</td><td>" + corner + "</td><td onClick='document.getElementById(`gameID`).value = `" + json.FoundGames[i] + "`; checkForGame();'>Dołącz</td></tr>";
                }
                gameListContent = gameListContent + "</table>";
                gameList.innerHTML = gameListContent;
            } else {
                gameList.innerHTML = "Nie znaleziono otwartych gier..";
            }
        }
    });
}

function randomizeShips()
{
    return;
    while(myShipCords.length < 10)
    {
        var x = parseInt(Math.floor(Math.random() * 10) + 1);
        var y = parseInt(Math.floor(Math.random() * 10) + 1);
        var r = parseInt(Math.floor(Math.random() * 10) + 1);
        if(r == 1)
        {
            rotated = true;
        } else {
            rotated = false;
        }
        hoverMapElement(document.getElementById("map_x" + x + "y" + y), true);
        placeShip(document.getElementById("map_x" + x + "y" + y));
    }
}