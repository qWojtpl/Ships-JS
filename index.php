<?php
    include('config.php');

    session_start();
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.8.0/chart.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <p id="title"><?php echo $page_title; ?></p>
    <noscript>Włącz JavaScript na tej stronie, aby zagrać w grę.</noscript>
    <p id="callback"></p>
    <table class="maps">
        <tr>
            <td class="maps"><p><?php echo $_LANGUAGE_PACK['yourMap']; ?></p></td>
            <td class="maps"><p>Mapa przeciwnika</p></td>
            <td class="maps"><p>Statki</p></td>
        </tr>
        <tr>
            <td class="maps"><div id='map'></div></td>
            <td class="maps"><div id='enemy'></div></td>
            <td class="maps"><div id='ships'></div></td>
        </tr>
    </table>
    
    <br>
    
    <div id='exit' onclick='leaveGame()'><p>Kliknij, aby opuścić grę</p></div>
    <div id='overlay_group'>
        <div id='overlay'></div>
        <div id='overlay_table'>
            <div id='overlay_content'>
            </div>
            <div id='create_game'><p>Chcesz stworzyć grę? <span onclick='createGame();'>Kliknij tutaj</span></p></div>
            <div id='overlay_exit' onclick="leaveGame()">X</div>
        </div>
    </div>
    <p id="ping"></p>
    <div id='tooSmallScreen'><p>Twoje okno przeglądarki jest zbyt małe, aby zobaczyć wszystkie elementy gry. Przytrzymaj <b>ctrl</b> a następnie spróbuj oddalać stronę scrollem myszki.</p></div>
    <script src="app.js"></script>
    <?php if(isset($_GET['join'])) echo '<script>preloadedCode="'.$_GET['join'].'"</script>'; ?>
</body>
</html>