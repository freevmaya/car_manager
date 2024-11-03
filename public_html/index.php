<?	
	error_reporting(E_ALL);
	session_start();
	include("classes/engine.php");


	trace($_GET);
	Page::Run(array_merge($_POST, $_GET));
?>