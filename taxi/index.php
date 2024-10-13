<?	
	error_reporting(E_ALL);
	session_start();
	define("BASEDIR", "..");
	include("../config/config.php");

	define('TEMPLATES_PATH', 'templates/');

	include(BASEDIR."/classes/User.php");
	include(BASEDIR."/classes/Utils.php");
	include(INCLUDE_PATH."/_edbu2.php");
	include(INCLUDE_PATH."/console.php");
	include(INCLUDE_PATH."/fdbg.php");
    include(INCLUDE_PATH.'/db/mySQLProvider.php');

	include("classes/page.php");

	(new Page(array_merge($_GET, $_POST)))->Render();
?>