<?
include(dirname(__FILE__, 3)."/config/config.php");

define("SITE_PATH", dirname(__FILE__, 2));
define('CLASSES_PATH', SITE_PATH.'/classes');
define('TEMPLATES_PATH', SITE_PATH.'/templates');
define("MODEL_PATH", SITE_PATH."/models");

define("DEFAULTPAGE", "begin");
define("DEFAULTFORM", "baseForm");

include(BASEDIR."/classes/Utils.php");
include(INCLUDE_PATH."/_edbu2.php");
include(INCLUDE_PATH."/console.php");
include(INCLUDE_PATH."/fdbg.php");
include(INCLUDE_PATH.'/db/mySQLProvider.php');
include(CLASSES_PATH.'/page.php');

$dbp;

function checkAndLoad($pathFile) {
	if (file_exists($pathFile)) {
    	include_once($pathFile);
    	return true;
	}

	//echo $pathFile."\n";
	return false;
}

spl_autoload_register(function ($class_name) {

    trace(MODEL_PATH.'/'.$class_name.'.php');

	if (!checkAndLoad(MODEL_PATH.'/'.$class_name.'.php'))

    	if (!checkAndLoad(CLASSES_PATH.'/'.$class_name.'.php')) 

    		if (!checkAndLoad(TEMPLATES_PATH.'/'.$class_name.'.php'))

    			throw new Exception("Can't load class {$class_name}, request: ".print_r(Page::$request, true), 1);
    			
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