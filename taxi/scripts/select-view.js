var SelectViewCallback = {};

function InitSelectView(fieldId, indexField, onSelect) {

	let view;
	$('#' + fieldId + ' .popup-button').click(()=>{
		view = viewManager.Create({curtain: $('.wrapper'),
						title: 'selectView',
						content: $('#' + fieldId + ' .items')});
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