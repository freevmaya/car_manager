<?

	define("BOTTOKEN", "7915848901:AAH-dqgbcU3olF_52Lwc1Uml_sKu9xu3M7s");
	define("DEV", ($_SERVER['SERVER_NAME'] == 'test-bot.com') || isset($_GET['dev']));
	define("INCLUDE_PATH", BASEDIR."/include/");
	define('LOGPATH', BASEDIR.'/logs/');
	define("MAINDOMAIN", $_SERVER['SERVER_NAME']);
	define("CHARSET", "utf-8");
	define('BASEURL', 'https://'.MAINDOMAIN.((MAINDOMAIN == "test-taxi.com") ? '' : '/parashop/car_manager/taxi'));

	if (DEV) {
		define('_dbhost', 'localhost');
		define('_dbname_default', 'taxi');
		define('_dbuser', 'root');
		define('_dbpassword', '');
		$devUser = '{"id":1573356581,"is_bot":false,"first_name":"Vadim","last_name":"Frolov","username":"FreeVmaya","language_code":"ru"}';
	} else {
		define('_dbhost', 'localhost');
		define('_dbname_default', 'fwadimuz_taxi');
		define('_dbuser', 'fwadimuz_taxi');
		define('_dbpassword', 'Vthkby2010');
	}

	define("APIKEY", "AIzaSyBzErLfg0nBPSCmP2LcYq0Y5A-C0GIuBMM");

	$anti_cache = '?4';
?>