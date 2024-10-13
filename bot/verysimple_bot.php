<?
	session_start();
	define("BASEDIR", "..");
	include("../config/config.php");
	include(BASEDIR."/classes/User.php");
	include(BASEDIR."/classes/Utils.php");
	include(INCLUDE_PATH."/_edbu2.php");
	include(INCLUDE_PATH."/console.php");
	include(INCLUDE_PATH."/fdbg.php");
    include(INCLUDE_PATH.'/db/mySQLProvider.php');
	include("classes/TelegramCommands.php");

	header('Content-Type: text/html; charset=utf-8');


	if (!DEV) {
		$str_data = file_get_contents('php://input');
		$data = json_decode($str_data, true);
		file_put_contents(__DIR__ . '/receive.json', $str_data);
	} else
		$data = json_decode(file_get_contents(__DIR__ . '/receive.json'), true);

	if (!empty($data['message']['text'])) {

    	$dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);
    	$user = new User($dbp, $data['message']['from']);
		$tcommands = new TelegramCommands($dbp, $data['message'], $user);
	    $tcommands->Exec();
	    $dbp->close();
	}
?>