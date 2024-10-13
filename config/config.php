<?

	define("BOTTOKEN", "7915848901:AAH-dqgbcU3olF_52Lwc1Uml_sKu9xu3M7s");
	define("DEV", ($_SERVER['SERVER_NAME'] == 'test-bot.com') || isset($_GET['dev']));
	define("INCLUDE_PATH", BASEDIR."/include/");
	define('LOGPATH', BASEDIR.'/logs/');
	define("MAINDOMAIN", $_SERVER['SERVER_NAME']);

	define('BASEURL', 'https://'.MAINDOMAIN.((MAINDOMAIN == "test-taxi.com") ? '' : '/parashop/taxi'));

	if (DEV) {
		define('_dbhost', 'localhost');
		define('_dbname_default', 'taxi');
		define('_dbuser', 'root');
		define('_dbpassword', '');
	} else {
		define('_dbhost', 'localhost');
		define('_dbname_default', 'fwadimuz_taxi');
		define('_dbuser', 'fwadimuz_taxi');
		define('_dbpassword', 'Vthkby2010');
	}

	define("APIKEY", "AIzaSyBzErLfg0nBPSCmP2LcYq0Y5A-C0GIuBMM");

//https://api.telegram.org/bot915848901:AAH-dqgbcU3olF_52Lwc1Uml_sKu9xu3M7s/setWebhook?url=https://vmaya.ru/parashop/bot/index.php
?>