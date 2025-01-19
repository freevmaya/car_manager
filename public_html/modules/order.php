<?
html::AddScriptFile("order.js");

html::AddJsCode("
	$(window).ready(()=>{
		window.orderManager = new OrderManager();
	});
", 'initOrderManager');
?>