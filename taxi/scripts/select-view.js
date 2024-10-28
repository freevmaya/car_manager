var SelectViewCallback = {};

function InitSelectView(fieldId, indexField, onSelect, title='', actions=[]) {

	let view;
	$('#' + fieldId + ' .popup-button').click(()=>{
		view = viewManager.Create({curtain: $('.wrapper'),
						title: title ? title : toLang('Select item'),
						content: $('#' + fieldId + ' .items'),
						actions: actions});
		view.contentElement.find('.option').each((i, item)=>{
			$(item).click(onClickItem);
		});
	});

	function onClickItem(e)  {
		let option = $(e.currentTarget);
		let id = option.data('id');
		let elem = $('#' + fieldId);

		onSelect(elem, option);
		$('input[name="' + indexField + '"]').val(id).trigger('change');
		view.Close();
	}
}