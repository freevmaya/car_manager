<?
    html::AddScriptFile('select-view.js');
    html::AddScriptFile('views.js');

    $number = @$value['item']['number'];
    $id = @$value['item']['id'];
    $fieldId = html::FiledId();

    html::AddJsCode("InitSelectView('{$fieldId}', '{$options['name']}', (elem, option)=>{
        //elem.find('.color-demo').css('background-color', option.find('.img').css('background-color'));
        elem.find('.value').text(option.find('.header').text());
    });");
?>
<div class="field" id="<?=$fieldId?>">
    <label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
    <div class="container">
        <div class="selectView" data-callback-index="<?=$fieldId?>">
            <div class="block">
                <div class="value"><?=$number?></div>
                <a class="button popup-button"></a>
            </div>
            <div class="items">
                <?foreach ($value['items'] as $item) {?>
                <div class="option" data-id="<?=$item['id']?>">
                    <div class="header"><?=$item['number']?></div>
                </div>
                <?}?>
            </div>
            <input type="hidden" name="<?=$options['name']?>" value="<?=$id?>">
        </div>
    </div>
</div>