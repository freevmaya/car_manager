<?
	
	define('BASEDIR', dirname(__FILE__, 2));
	define("BOTTOKEN", "7915848901:AAH-dqgbcU3olF_52Lwc1Uml_sKu9xu3M7s");
	define("DEV", (strpos($_SERVER['SERVER_NAME'], 'test') > -1) || isset($_GET['dev']));
	define("INCLUDE_PATH", BASEDIR."/include/");
	define('LOGPATH', BASEDIR.'/logs/');
	define("MAINDOMAIN", $_SERVER['SERVER_NAME']);
	define("CHARSET", "utf-8");
	define('BASEURL', '//'.MAINDOMAIN);//'https://'.MAINDOMAIN.((MAINDOMAIN == "test-taxi.com") ? '' : '/parashop/car_manager/taxi'));
	define('SCRIPTURL', BASEURL.'/scripts');

	if (DEV) {

		define('_dbhost', 'localhost');
		define('_dbname_default', 'taxi');
		define('_dbuser', 'root');
		define('_dbpassword', '');
		$defUser = '{"id":1573356581,"is_bot":false,"first_name":"Vadim","last_name":"Frolov","username":"FreeVmaya","language_code":"ru"}';
	} else {
		define('_dbhost', 'localhost');
		define('_dbname_default', 'fwadimuz_taxi');
		define('_dbuser', 'fwadimuz_taxi');
		define('_dbpassword', 'Vthkby2010');

		$defUser = '{"id":0,"is_bot":false,"first_name":"Guest","last_name":"User","username":"Guest","language_code":"ru"}';
	}

	define("APIKEY", "AIzaSyBzErLfg0nBPSCmP2LcYq0Y5A-C0GIuBMM");

	$anti_cache = '?_=5';
?>