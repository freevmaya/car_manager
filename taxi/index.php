<?	
	error_reporting(E_ALL);
	session_start();
	include("../config/config.php");

	define("SITE_PATH", dirname(__FILE__));
	define('CLASSES_PATH', SITE_PATH.'/classes');
	define('TEMPLATES_PATH', SITE_PATH.'/templates');
	define("MODEL_PATH", SITE_PATH."/models");

	//include(BASEDIR."/classes/User.php");
	include(BASEDIR."/classes/Utils.php");
	include(INCLUDE_PATH."/_edbu2.php");
	include(INCLUDE_PATH."/console.php");
	include(INCLUDE_PATH."/fdbg.php");
    include(INCLUDE_PATH.'/db/mySQLProvider.php');
	include(CLASSES_PATH.'/page.php');

	Page::Run(array_merge($_GET, $_POST));
?>