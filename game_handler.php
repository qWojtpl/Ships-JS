<?php

    /*

    Ships
    Version: 0.1
    ServerSide-Version
    game_handler.php

    */

    session_start();

    include('config.php');

    $conn = mysqli_connect($_DB['host'], $_DB['user'], $_DB['password'], $_DB['db_name']);

    $_OUTPUT = array();

    function showOutput($_OUTPUT)
    {
        echo json_encode($_OUTPUT);
        exit();
    }

    function checkPlayerInGame()
    {
        if(!isset($_SESSION['gameid']))
        {
            $_OUTPUT['Error'] = "1";
            $_OUTPUT['ErrorMessage'] = "Youre not in game";
            showOutput($_OUTPUT);
        }
    }

    function closeWhenPlayerInGame()
    {
        if(isset($_SESSION['gameid']))
        {
            $_OUTPUT['Error'] = "1";
            $_OUTPUT['ErrorMessage'] = "Youre already in game";
            showOutput($_OUTPUT);
        }
    }

    function deleteOldGames($conn)
    {
        $query = mysqli_query($conn, 'SELECT * FROM games WHERE DATEDIFF(now(), createDate) >= 2 OR status=-1 OR status=-2');
        if(mysqli_num_rows($query) > 0)
        {
            while($row = mysqli_fetch_assoc($query))
            {
                $query2 = mysqli_query($conn, 'DELETE FROM shipPlacementCount WHERE id_game='.$row['id_game']);
                $query2 = mysqli_query($conn, 'DELETE FROM ships WHERE id_game='.$row['id_game']);
                $query2 = mysqli_query($conn, 'DELETE FROM shots WHERE id_game='.$row['id_game']);
                $query2 = mysqli_query($conn, 'DELETE FROM games WHERE id_game='.$row['id_game']);
            }
        }
    }

    if(!$conn)
    {
        $_OUTPUT['Error'] = "1";
        $_OUTPUT['ErrorMessage'] = "Internal server error";
        showOutput($_OUTPUT);
    }

    if(!isset($_GET['type'])) {
        $_OUTPUT['Error'] = "1";
        $_OUTPUT['ErrorMessage'] = "Missing type";
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "CheckGame")
    {
        $value = '';
        $isHost = "NotSet";
        if(isset($_SESSION['isHost']))
        {
            $isHost = $_SESSION['isHost'];
        }
        if(!isset($_GET['value']))
        {
            if(!isset($_SESSION['gameid']))
            {
                $_OUTPUT['Error'] = "0";
                $_OUTPUT['GameFound'] = "0";
                showOutput($_OUTPUT);
            } else {
                $value = $_SESSION['gameid'];
            }
        } else {
            $value = $_GET['value'];
        }
        $query = mysqli_query($conn, 'SELECT * FROM games WHERE id_game="'.$value.'"');
        $status = '';
        if(mysqli_num_rows($query) > 0)
        {
            while($row = mysqli_fetch_assoc($query)) {
                $status = $row['status'];
                $_OUTPUT['Error'] = "0";
                $_OUTPUT['GameFound'] = "1";
                $_OUTPUT['Status'] = $status;
                $_OUTPUT['isHost'] = $isHost;
                $_OUTPUT['GameOpened'] = $row['opened'];
                $_OUTPUT['Corners'] = $row['corners'];
            }
        } else {
            $_OUTPUT['Error'] = "0";
            $_OUTPUT['GameFound'] = "0";
        }
        if($_GET['source'] === "Host")
        {
            if($_SESSION['isHost'] == 1)
            {
                if($_SESSION['isAwaiting'] == 1)
                {
                    if($status == '1')
                    {
                        $_SESSION['isAwaiting'] = 0;
                        $query = mysqli_query($conn, 'UPDATE games SET status=2 WHERE id_game="'.$_SESSION['gameid'].'"');
                    }
                    $_OUTPUT['SourceHost'] = "1";
                    showOutput($_OUTPUT);

                } else {
                    $_OUTPUT['SourceHost'] = "0";
                    showOutput($_OUTPUT);
                }
            } else {
                $_OUTPUT['SourceHost'] = $_SESSION['isAwaiting'];
                showOutput($_OUTPUT);
            }
        } else {
            showOutput($_OUTPUT);
        }
    }

    if($_GET['type'] == "JoinGame")
    {
        closeWhenPlayerInGame();
        if(!isset($_GET['value']))
        {
            $_OUTPUT['Error'] = "0";
            $_OUTPUT['GameFound'] = "0";
            showOutput($_OUTPUT);
        }
        $query = mysqli_query($conn, 'SELECT * FROM games WHERE id_game="'.$_GET['value'].'"');
        if(mysqli_num_rows($query) > 0)
        {
            while($row = mysqli_fetch_assoc($query)) {
                if($row["status"] == 0)
                {
                    $_SESSION['isHost'] = 0;
                    $_SESSION['gameid'] = $_GET['value'];
                    $query2 = mysqli_query($conn, 'UPDATE games SET status=1 WHERE id_game="'.$_GET['value'].'"');
                    $_OUTPUT['Error'] = "0";
                    $_OUTPUT['GameFound'] = "1";
                    $_OUTPUT['Status'] = $row['status'];
                    $_OUTPUT['Joined'] = "1";
                    $_OUTPUT['GameID'] = $_GET['value'];
                    $_OUTPUT['isHost'] = "0";
                    showOutput($_OUTPUT);
                } else {
                    $_OUTPUT['Error'] = "0";
                    $_OUTPUT['GameFound'] = "1";
                    $_OUTPUT['Status'] = $row['status'];
                    $_OUTPUT['Joined'] = "0";
                    showOutput($_OUTPUT);
                }
            }
        } else {
            $_OUTPUT['Error'] = "0";
            $_OUTPUT['GameFound'] = "0";
            $_OUTPUT['Joined'] = "0";
            showOutput($_OUTPUT);
        }
    }

    if($_GET['type'] == "CreateGame")
    {
        closeWhenPlayerInGame();
        deleteOldGames($conn);
        $_SESSION['isAwaiting'] = 1;
        $_SESSION['isHost'] = 1;
        $query = mysqli_query($conn, 'INSERT INTO games VALUES(default, 0, 0, 0, now())');
        $query = mysqli_query($conn, 'SELECT * FROM games GROUP BY id_game DESC LIMIT 1');
        while($row = mysqli_fetch_assoc($query)) {
            $_SESSION['gameid'] = $row['id_game'];
            $_OUTPUT['Error'] = "0";
            $_OUTPUT['CreatedGame'] = "1";
            $_OUTPUT['GameID'] = $_SESSION['gameid'];
            showOutput($_OUTPUT);
        }
    }

    if($_GET['type'] == "CheckPlayer")
    {
        $gameid = "NotSet";
        $isHost = "NotSet";
        $isAwaiting = "NotSet";
        if(isset($_SESSION['gameid'])) $gameid = $_SESSION['gameid'];
        if(isset($_SESSION['isHost'])) $isHost = $_SESSION['isHost'];
        if(isset($_SESSION['isAwaiting'])) $isAwaiting = $_SESSION['isAwaiting'];
        $_OUTPUT['Error'] = "0";
        $_OUTPUT['InGame'] = $gameid;
        $_OUTPUT['GameID'] = $gameid;
        $_OUTPUT['isHost'] = $isHost;
        $_OUTPUT['isAwaiting'] = $isAwaiting;
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "LeaveGame")
    {
        checkPlayerInGame();
        $query = mysqli_query($conn, 'UPDATE games SET status=-2 WHERE id_game="'.$_SESSION['gameid'].'"');
        unset($_SESSION['gameid']);
        unset($_SESSION['isHost']);
        unset($_SESSION['isAwaiting']);
        return;
    }

    if($_GET['type'] == "PlaceShip")
    {
        checkPlayerInGame();
        $canPlace = 0;
        $showError = 1;
        if(!isset($_GET['cordsCount']) || !isset($_GET['rotated']))
        {
            $_OUTPUT['Error'] = $showError;
            $_OUTPUT['CanPlace'] = $canPlace;
            showOutput($_OUTPUT);
        }
        $cordsCount = intval($_GET['cordsCount']);
        if($cordsCount > 4 || $cordsCount < 1)
        {
            $_OUTPUT['Error'] = $showError;
            $_OUTPUT['CanPlace'] = $canPlace;
            showOutput($_OUTPUT);
        }
        $rotated = boolval($_GET['rotated']);
        // Get game info
        $query = mysqli_query($conn, 'SELECT * FROM games WHERE id_game="'.$_SESSION['gameid'].'"');
        if(mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                $corner = $row['corners'];
            }
        }
        // Check player has free ships
        $query = mysqli_query($conn, 'SELECT * FROM shipPlacementCount WHERE shipType="'.$cordsCount.'" AND id_game="'.$_SESSION['gameid'].'" AND isHost="'.$_SESSION['isHost'].'"');
        $number = 0;
        $update = 0;
        if (mysqli_num_rows($query) > 0) {
            $update = 1;
            while($row = mysqli_fetch_assoc($query)) {
                $number = $row['shipCount'];
            }
        }
        $showError = 0;
        if($cordsCount == 1) if($number == 4) { $canPlace = 0; $showError = 1; }
        if($cordsCount == 2) if($number == 3) { $canPlace = 0; $showError = 1; }
        if($cordsCount == 3) if($number == 2) { $canPlace = 0; $showError = 1; }
        if($cordsCount == 4) if($number == 1) { $canPlace = 0; $showError = 1; }
        if($showError == 1)
        {
            $_OUTPUT['Error'] = $showError;
            $_OUTPUT['CanPlace'] = $canPlace;
            showOutput($_OUTPUT);
        }
        // Load ships that player want to place
        $xL = array();
        $yL = array();
        for($i = 0; $i < $cordsCount; $i++)
        {
            if(!isset($_GET['x'.$i]) || !isset($_GET['y'.$i]))
            {
                $showError = 1;
                $_OUTPUT['Error'] = $showError;
                $_OUTPUT['CanPlace'] = $canPlace;
                showOutput($_OUTPUT);
            } else {
                if(intval($_GET['x'.$i]) > 10 || intval($_GET['x'.$i]) < 0 || intval($_GET['y'.$i]) > 10 || intval($_GET['y'.$i]) < 0)
                {
                    $showError = 1;
                    $_OUTPUT['Error'] = $showError;
                    $_OUTPUT['CanPlace'] = $canPlace;
                    showOutput($_OUTPUT);
                }
                array_push($xL, intval($_GET['x'.$i]));
                array_push($yL, intval($_GET['y'.$i]));
            }
        }
        // Check distance between points
        $previousX = "";
        $previousY = "";
        $canPlace = 0;
        for($i = 0; $i < $cordsCount; $i++)
        {
            if($previousX != "" && $previousY != "")
            {
                if(!$rotated)
                {
                    if($xL[$i] - $previousX > 1)
                    {
                        $showError = 1;
                        $_OUTPUT['Error'] = $showError;
                        $_OUTPUT['CanPlace'] = $canPlace;
                        showOutput($_OUTPUT);
                    }
                } else {
                    if($yL[$i] - $previousY > 1)
                    {
                        $showError = 1;
                        $_OUTPUT['Error'] = $showError;
                        $_OUTPUT['CanPlace'] = $canPlace;
                        showOutput($_OUTPUT);
                    }
                }
            }
            $previousX = $xL[$i];
            $previousY = $yL[$i];
        }
        // Check for other ships
        $canPlace = 1;
        $showError = 0;
        $query = mysqli_query($conn, 'SELECT * FROM ships WHERE id_game="'.$_SESSION['gameid'].'" AND isHost='.$_SESSION['isHost'].'');
        if (mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                $x = intval($row['cordX']);
                $y = intval($row['cordY']);
                for($i = 0; $i < $cordsCount; $i++)
                {
                    $a = $xL[$i] + 1;
                    if($a == $x && $yL[$i] == $y) { $canPlace = 0; $showError = 1; }
                    $a = $xL[$i] - 1;
                    if($a == $x && $yL[$i] == $y) { $canPlace = 0; $showError = 1; }
                    $a = $yL[$i] + 1;
                    if($a == $y && $xL[$i] == $x) { $canPlace = 0; $showError = 1; }
                    $a = $yL[$i] - 1;
                    if($a == $y && $xL[$i] == $x) { $canPlace = 0; $showError = 1; }
                    if($xL[$i] == $x && $yL[$i] == $y) { $canPlace = 0; $showError = 1; }
                    if($corner == 0)
                    {
                        $a = $xL[$i] + 1;
                        $b = $yL[$i] + 1;
                        if($a == $x && $b == $y) { $canPlace = 0; $showError = 1; }
                        $a = $xL[$i] - 1;
                        $b = $yL[$i] + 1;
                        if($a == $x && $b == $y) { $canPlace = 0; $showError = 1; }
                        $a = $xL[$i] + 1;
                        $b = $yL[$i] - 1;
                        if($a == $x && $b == $y) { $canPlace = 0; $showError = 1; }
                        $a = $xL[$i] - 1;
                        $b = $yL[$i] - 1;
                        if($a == $x && $b == $y) { $canPlace = 0; $showError = 1; }
                    }
                    if($showError == 1)
                    {
                        $_OUTPUT['Error'] = $showError;
                        $_OUTPUT['CanPlace'] = $canPlace;
                        showOutput($_OUTPUT);
                    }
                }
            }
        }
        if($rotated)
        {
            $rotated = 1;
        } else {
            $rotated = 0;
        }
        if($canPlace == 1)
        {
            $number = $number + 1;
            if($update == 1)
            {
                $query = mysqli_query($conn, 'UPDATE shipPlacementCount SET shipCount="'.$number.'" WHERE shipType="'.$cordsCount.'" AND id_game="'.$_SESSION['gameid'].'" AND isHost='.$_SESSION['isHost'].'');
            } else {
                $query = mysqli_query($conn, 'INSERT INTO shipPlacementCount VALUES(default, "'.$cordsCount.'", "'.$number.'", "'.$_SESSION['gameid'].'", '.$_SESSION['isHost'].')');
            }
            for($i = 0; $i < $cordsCount; $i++)
            {
                $query = mysqli_query($conn, 'INSERT INTO ships VALUES(default, '.$_SESSION['isHost'].', "'.$_SESSION['gameid'].'", "'.$xL[$i].'", "'.$yL[$i].'", "'.$cordsCount.'", "'.$rotated.'")');
            }
            $_OUTPUT['Error'] = $showError;
            $_OUTPUT['CanPlace'] = $canPlace;
            $_OUTPUT['Placed'] = "1";
        }
        $query = mysqli_query($conn, 'SELECT * FROM ships WHERE id_game="'.$_SESSION['gameid'].'"');
        if(mysqli_num_rows($query) == 40)
        {
            $query = mysqli_query($conn, 'UPDATE games SET status=3 WHERE id_game="'.$_SESSION['gameid'].'"');
        }
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "Attack")
    {
        checkPlayerInGame();
        if(!isset($_GET['cordX']) || !isset($_GET['cordY']))
        {
            $_OUTPUT['Error'] = "1";
            showOutput($_OUTPUT);
        }
        $x = intval($_GET['cordX']);
        $y = intval($_GET['cordY']);
        if($x > 10 || $x < 0 || $y > 10 || $y < 0)
        {
            $_OUTPUT['Error'] = "1";
            showOutput($_OUTPUT);
        }
        $query = mysqli_query($conn, 'SELECT * FROM games WHERE id_game="'.$_SESSION['gameid'].'"');
        if(mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                if($row['status'] != "3" && $row['status'] != "4")
                {
                    $_OUTPUT['Error'] = "1";
                    showOutput($_OUTPUT);
                }
                if($row['status'] == "3" && $_SESSION['isHost'] != 1) {
                    $_OUTPUT['Error'] = "1";
                    showOutput($_OUTPUT);
                } else {
                    if($row['status'] == "4" && $_SESSION['isHost'] == 1) {
                        $_OUTPUT['Error'] = "1";
                        showOutput($_OUTPUT);
                    }
                }
                $status = $row['status'];
            }
        }
        $query = mysqli_query($conn, 'SELECT * FROM shots WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$_SESSION['isHost'].'"');
        if(mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                if($x == $row['cordX'] && $y == $row['cordY'])
                {
                    $_OUTPUT['Error'] = "1";
                    showOutput($_OUTPUT);
                }
            }
        }
        $query = mysqli_query($conn, 'INSERT INTO shots VALUES(default, '.$_SESSION['isHost'].', "'.$_SESSION['gameid'].'", "'.$x.'", "'.$y.'")');
        $reverse = 1;
        if($_SESSION['isHost'] == 1)
        {
            $reverse = 0;
        }
        $query = mysqli_query($conn, 'SELECT * FROM ships WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$reverse.'" AND cordX="'.$x.'" AND cordY="'.$y.'"');
        if(mysqli_num_rows($query) > 0)
        {
            $_OUTPUT['Hit'] = "1";
            $hit = 1;
        } else {
            $_OUTPUT['Hit'] = "0";
            $hit = 0;
        }
        if($hit == 0)
        {
            $reverse = 3;
            if($_SESSION['isHost'] == 1)
            {
                $reverse = 4;
            }
        } else {
            $reverse = 4;
            if($_SESSION['isHost'] == 1)
            {
                $reverse = 3;
            }
        }
        $query = mysqli_query($conn, 'UPDATE games SET status="'.$reverse.'" WHERE id_game="'.$_SESSION['gameid'].'"');
        $query = mysqli_query($conn, 'SELECT * FROM shots WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$_SESSION['isHost'].'"');
        $shots = array();
        $trueshots = array();
        $reverse = 1;
        if($_SESSION['isHost'] == 1)
        {
            $reverse = 0;
        }
        if(mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                array_push($shots, 'enemy_x'.$row['cordX'].'y'.$row['cordY']);
                $query2 = mysqli_query($conn, 'SELECT * FROM ships WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$reverse.'" AND cordX="'.$row['cordX'].'" AND cordY="'.$row['cordY'].'"');
                if(mysqli_num_rows($query2) > 0) {
                    while($row2 = mysqli_fetch_assoc($query2)) {
                        if($row['cordX'] == $row2['cordX'] && $row['cordY'] == $row2['cordY'])
                        {
                            array_push($trueshots, 'enemy_x'.$row['cordX'].'y'.$row['cordY']);
                        }
                    }
                }
            }
        }
        $_OUTPUT['TrueShots'] = $trueshots;
        if(count($trueshots) == 20)
        {
            $query = mysqli_query($conn, 'UPDATE games SET status="-1" WHERE id_game="'.$_SESSION['gameid'].'"');
        }
        showOutput($_OUTPUT);
    }

    // Importing ships from database - using session to get gameid and host info
    
    if($_GET['type'] == 'GetMyShips')
    {
        checkPlayerInGame();
        $myShips = array();
        $query = mysqli_query($conn, 'SELECT cordX, cordY FROM ships WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$_SESSION['isHost'].'"');
        if (mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                array_push($myShips, 'map_x'.$row['cordX'].'y'.$row['cordY']);
            }
        }
        $_OUTPUT['Error'] = "0";
        $_OUTPUT['MyShips'] = $myShips;
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == 'GetMyShipCount')
    {
        checkPlayerInGame();
        $query = mysqli_query($conn, 'SELECT * FROM shipPlacementCount WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$_SESSION['isHost'].'"');
        $shipCount = array();
        $shipCount[0] = 0;
        $shipCount[1] = 0;
        $shipCount[2] = 0;
        $shipCount[3] = 0;
        if (mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                $shipCount[$row['shipType']-1] = $row['shipCount'];
            }
        }
        $_OUTPUT['Error'] = "0";
        $_OUTPUT['MyShipCount'] = $shipCount;
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "GetMyShots")
    {
        checkPlayerInGame();
        $query = mysqli_query($conn, 'SELECT * FROM shots WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$_SESSION['isHost'].'"');
        $shots = array();
        $trueshots = array();
        $trueshotsX = array();
        $trueshotsY = array();
        $trueshotsXY = array();
        $reverse = 1;
        if($_SESSION['isHost'] == 1)
        {
            $reverse = 0;
        }
        if(mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                array_push($shots, 'enemy_x'.$row['cordX'].'y'.$row['cordY']);
                $query2 = mysqli_query($conn, 'SELECT * FROM ships WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$reverse.'" AND cordX="'.$row['cordX'].'" AND cordY="'.$row['cordY'].'"');
                if(mysqli_num_rows($query2) > 0) {
                    while($row2 = mysqli_fetch_assoc($query2)) {
                        
                        if($row['cordX'] == $row2['cordX'] && $row['cordY'] == $row2['cordY'])
                        {
                            array_push($trueshots, 'enemy_x'.$row['cordX'].'y'.$row['cordY']);
                            array_push($trueshotsX, $row['cordX']);
                            array_push($trueshotsY, $row['cordY']);
                            array_push($trueshotsXY, $row['cordX'].$row['cordY']);
                        }
                    }
                }
            }
        }

        $_OUTPUT['Shots'] = $shots;
        $_OUTPUT['TrueShots'] = $trueshots;

        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "GetEnemyShots")
    {
        checkPlayerInGame();
        $reverse = 1;
        if($_SESSION['isHost'] == 1)
        {
            $reverse = 0;
        }
        $query = mysqli_query($conn, 'SELECT * FROM shots WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$reverse.'"');
        $shots = array();
        $trueshots = array();
        if(mysqli_num_rows($query) > 0) {
            while($row = mysqli_fetch_assoc($query)) {
                array_push($shots, 'map_x'.$row['cordX'].'y'.$row['cordY']);
                $query2 = mysqli_query($conn, 'SELECT * FROM ships WHERE id_game="'.$_SESSION['gameid'].'" AND isHost="'.$_SESSION['isHost'].'" AND cordX="'.$row['cordX'].'" AND cordY="'.$row['cordY'].'"');
                if(mysqli_num_rows($query2) > 0) {
                    while($row2 = mysqli_fetch_assoc($query2)) {
                        if($row['cordX'] == $row2['cordX'] && $row['cordY'] == $row2['cordY'])
                        {
                            array_push($trueshots, 'map_x'.$row['cordX'].'y'.$row['cordY']);
                        }
                    }
                }
            }
        }
        $_OUTPUT['Error'] = "0";
        $_OUTPUT['Shots'] = $shots;
        $_OUTPUT['TrueShots'] = $trueshots;
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "SwitchSettings")
    {
        if(!isset($_GET['setting']))
        {
            $_OUTPUT['Error'] = "1";
            $_OUTPUT['ErrorMessage'] = "Unknown setting type..";
            showOutput($_OUTPUT);
        }
        checkPlayerInGame();
        if($_SESSION['isHost'] != 1)
        {
            $_OUTPUT['Error'] = "1";
            $_OUTPUT['ErrorMessage'] = "Youre not a host";
            showOutput($_OUTPUT);
        }
        $query = mysqli_query($conn, 'SELECT * FROM games WHERE id_game="'.$_SESSION['gameid'].'"');
        $reverse = 1;
        if($_GET['setting'] == 0) $type = "opened";
        if($_GET['setting'] == 1) $type = "corners";
        if(mysqli_num_rows($query) > 0)
        {
            while($row = mysqli_fetch_assoc($query))
            {
                if($row['status'] != 0)
                {
                    $_OUTPUT['Error'] = "1";
                    $_OUTPUT['ErrorMessage'] = "Game is already started; cannot change opened state.";
                    showOutput($_OUTPUT);
                }
                if($row[$type] == 1)
                {
                    $reverse = 0;
                }
            }
        }
        $query = mysqli_query($conn, 'UPDATE games SET '.$type.'='.$reverse.' WHERE id_game="'.$_SESSION['gameid'].'"');
        $_OUTPUT['Error'] = "0";
        $_OUTPUT['SwitchValue'] = $reverse;
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "SearchForOpenedGames")
    {
        closeWhenPlayerInGame();
        deleteOldGames($conn);
        $query = mysqli_query($conn, 'SELECT * FROM games WHERE opened=1 AND status=0');
        $codes = array();
        $corners = array();
        if(mysqli_num_rows($query) > 0)
        {
            while($row = mysqli_fetch_assoc($query))
            {
                array_push($codes, $row['id_game']);
                array_push($corners, $row['corners']);
            }
        }
        $_OUTPUT['Error'] = "0";
        $_OUTPUT['FoundGames'] = $codes;
        $_OUTPUT['CornerInfo'] = $corners;
        $_OUTPUT['NumOfGames'] = mysqli_num_rows($query);
        showOutput($_OUTPUT);
    }

    if($_GET['type'] == "GetLanguagePack")
    {
        $_OUTPUT['Error'] = "0";
        $_OUTPUT['LanguagePack'] = $_LANGUAGE_PACK;
        showOutput($_OUTPUT);
    }

    /*$_OUTPUT['Error'] = "1";
    $_OUTPUT['ErrorMessage'] = "Type not found..";

    showOutput($_OUTPUT);*/

    mysqli_close($conn);

?>