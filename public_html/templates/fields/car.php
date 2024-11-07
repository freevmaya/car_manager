<?
    html::AddScriptFile('select-view.js');
    html::AddScriptFile('views.js');

    $valueStr = CarModel::getCarIndent(@$value['item']);
    $id = @$value['item']['id'];
    $fieldIdx = html::fieldIdx();

    html::AddJsCode("InitSelectView(".$fieldIdx.", '{$options['name']}', (elem, option)=>{
        elem.find('.value').text(option.find('.header').text());
    }, toLang('Select auto'), {Add: ()=>{document.location.href = '".Page::link(['driver', 'editcar'])."';}});");
?>
<div class="field" data-id="<?=$fieldIdx?>">
    <label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
    <input type="hidden" name="<?=$options['name']?>" value="<?=$id?>">
    <div class="container">
        <div class="selectView" data-callback-index="<?=$fieldIdx?>">
            <div class="block">
                <div class="value"><?=$valueStr?></div>
                <a class="button popup-button"></a>
            </div>
            <div class="items cars">
                <?foreach ($value['items'] as $item) {?>
                <div class="option" data-id="<?=$item['id']?>">
                    <div class="header"><?=CarModel::getCarIndent($item)?></div>
                </div>
                <?}?>
            </div>
        </div>
    </div>
</div>