<?

define('BASEDIR', dirname(__FILE__, 3));
define("DEV", true);
define("INCLUDE_PATH", BASEDIR."/include/");
define('LOGPATH', BASEDIR.'/logs/');
define("MAINDOMAIN", 'test-taxi.com');
define("CHARSET", "utf-8");
define('BASEURL', '//'.MAINDOMAIN);//'https://'.MAINDOMAIN.((MAINDOMAIN == "test-taxi.com") ? '' : '/parashop/car_manager/taxi'));
define('SCRIPTURL', BASEURL.'/scripts');
define("APIKEY", "AIzaSyBzErLfg0nBPSCmP2LcYq0Y5A-C0GIuBMM");

define('_dbhost', 'localhost');
define('_dbname_default', 'taxi');
define('_dbuser', 'root');
define('_dbpassword', '');

define('DEVUSER', '{"id":1573356581,"is_bot":false,"first_name":"Vadim","last_name":"Frolov","username":"FreeVmaya","language_code":"ru"}');

define("SITE_PATH", dirname(__FILE__, 2));
define('CLASSES_PATH', SITE_PATH.'/classes');
define('TEMPLATES_PATH', SITE_PATH.'/templates');
define("MODEL_PATH", SITE_PATH."/models");

define("DEFAULTPAGE", "begin");
define("DEFAULTFORM", "baseForm");

define('AREA_RADIUS', 5000);
define('ACTIVEORDERLIST', "'wait', 'accepted', 'driver_move', 'wait_meeting', 'execution', 'expired'");
define('ACTIVEORDERLIST_ARR', ['wait', 'accepted', 'driver_move', 'wait_meeting', 'execution', 'expired']);
define('INACTIVEORDERLIST_ARR', ['rejected', 'cancel', 'finished']);
define('OFFLINEINTERVAL', 'INTERVAL 15 SECOND');
define('LOSTCONNECTINTERVAL', 'INTERVAL 10 MINUTE');
define('MAXEXPIRED_SEC', 60 * 60);
define('TRAVELMODE', 'DRIVING');
define('MAXEXPIREORDERRIME', 'INTERVAL 2 DAY');

include(BASEDIR."/classes/Utils.php");
include(INCLUDE_PATH."/_edbu2.php");
include(INCLUDE_PATH."/console.php");
include(INCLUDE_PATH."/fdbg.php");
include(INCLUDE_PATH.'/db/mySQLProvider.php');
include('tracer.php');

$dbp;

function checkAndLoad($pathFile) {
	if (file_exists($pathFile)) {
    	include_once($pathFile);
    	return true;
	}
	return false;
}

spl_autoload_register(function ($class_name) {

    if (!checkAndLoad(CLASSES_PATH.'/'.$class_name.'.php')) {

        if (!checkAndLoad(MODEL_PATH.'/'.$class_name.'.php')) {

    		if (!checkAndLoad(TEMPLATES_PATH.'/'.$class_name.'.php')) {

                trace("Class not found: {$class_name}");

    			throw new Exception("Can't load class {$class_name}, request: ".print_r(Page::$request, true), 1);
            }
        }
    }
    			
});


if (!function_exists('array_is_list')) {
    function array_is_list(array $arr)
    {
        if ($arr === []) {
            return true;
        }
        return array_keys($arr) === range(0, count($arr) - 1);
    }
}

?>