var SelectViewCallback = {};

function InitSelectView(fieldId, indexField, onSelect, title='', actions=[]) {

	let view;

	$('*[data-id=' + fieldId + '] .popup-button').click(()=>{
		view = viewManager.Create({modal: true,
						title: title ? title : toLang('Select item'),
						content: $('*[data-id=' + fieldId + '] .items'),
						clone: true,
						actions: actions});
		view.contentElement.find('.option').each((i, item)=>{
			$(item).click(onClickItem);
		});
	});

	function onClickItem(e)  {
		let option = $(e.currentTarget);
		let id = option.data('id');

		let elem = $('*[data-id=' + fieldId + ']');

		onSelect(elem, option, e);
		$('input[name="' + indexField + '"]').val(id).trigger('change');
		view.Close();
	}
}