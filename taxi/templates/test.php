<?
	$this->scripts[] = "https://code.jquery.com/ui/1.14.0/jquery-ui.js";
	$this->styles[] = "https://code.jquery.com/ui/1.14.0/themes/base/jquery-ui.css";
?>

<script type="text/javascript">
    $(function() {
    	let elem = $('<div>');
    	$('body').append(elem);
        new DateTime(elem, '15.09.2024 12:30');
    });
</script>