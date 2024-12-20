<?
include(dirname(__FILE__, 3)."/config/config.php");

define("SITE_PATH", dirname(__FILE__, 2));
define('CLASSES_PATH', SITE_PATH.'/classes');
define('TEMPLATES_PATH', SITE_PATH.'/templates');
define("MODEL_PATH", SITE_PATH."/models");
define('MODULESPATH', SITE_PATH."/modules");

define("DEFAULTPAGE", "begin");
define("DEFAULTFORM", "baseForm");

define('AREA_RADIUS', 5000);
define('ACTIVEORDERLIST', "'wait', 'accepted', 'driver_move', 'wait_meeting', 'execution', 'expired'");
define('ACTIVEORDERLIST_ARR', ['wait', 'accepted', 'driver_move', 'wait_meeting', 'execution', 'expired']);
define('INACTIVEORDERLIST_ARR', ['rejected', 'cancel']);
define('OFFLINEINTERVAL', 'INTERVAL 15 SECOND');
define('LOSTCONNECTINTERVAL', 'INTERVAL 10 MINUTE');

include(BASEDIR."/classes/Utils.php");
include(INCLUDE_PATH."/_edbu2.php");
include(INCLUDE_PATH."/console.php");
include(INCLUDE_PATH."/fdbg.php");
include(INCLUDE_PATH.'/db/mySQLProvider.php');
include(CLASSES_PATH.'/page.php');

/*
include(CLASSES_PATH.'/html.php');
include(CLASSES_PATH.'/ajax.php');
include(CLASSES_PATH.'/settings.php');
include(CLASSES_PATH.'/map.php');
include(MODEL_PATH.'/BaseModel.php');
include(MODEL_PATH.'/CarbodyModel.php');
*/

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