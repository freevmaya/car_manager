<?
    $this->scripts[] = "jquery-dateformat.min.js";
    $this->scripts[] = "main.js";
    $this->scripts[] = "map.js";
    $this->scripts[] = "views.js";
    //$this->scripts[] = "driver.js";
    //$this->scripts[] = "driver-manager.js";
    $this->scripts[] = "select-target.js";
    //$this->scripts[] = "notifications.js";
    
    $this->scripts[] = "https://code.jquery.com/ui/1.14.0/jquery-ui.js";

    $this->styles[] = "https://code.jquery.com/ui/1.14.0/themes/base/jquery-ui.css";
    $this->styles[] = 'css/colors-01.css';
?>

<script type="text/javascript">
    $('window').ready(()=>{
    	let elem = $('<div>');
    	$('body').append(elem);
        //new DateTime(elem, '2024-09-12 12:30:00');
        new DateTime(elem, Date.now());
    });
</script>

<div id="windows">
  <div class="view shadow radiusTop" style="bottom: 0px;">
    <div class="title">
      <h3>Маршрут</h3>
      <button class="close button"></button>
    </div>
    <div class="content target-view">
      <div class="field" data-id="startPlace">
        <p>Hotel Flyers Paradise</p>
      </div><span class="infoView hidden">2PRH+4H6, Gunehar Rd, Bir, Himachal Pradesh 176077, Индия</span>
      <div class="field">
        <div class="divider"></div>
      </div>
      <div class="field" data-id="finishPlace">
        <p>Nadaras Foundation</p>
      </div><span class="infoView hidden">Nadaras Foundation, Kotli, Himachal Pradesh 176077, Индия</span></div>


    <div class="footer btn-block sliderView">
      <div class="slider">
        <div class="slider-group">
            <button class="button" onclick="closeView($(this).parent('.slider-group'))">Отправить</button>
            <div class="datetime-field shadow datetime">Сейчас</div>
        </div>
        <div class="notify">
            <div class="car-image smallcar"></div>
            В бескрайних просторах современного мира, где скоростные шоссе переплетаются с извивающимися городскими улицами, машина становится символом свободы и прогресса. 
        </div>
        <div class="notify">
            <div class="car-image microcar"></div>
            В бескрайних просторах современного мира, где скоростные шоссе переплетаются с извивающимися городскими улицами, машина становится символом свободы и прогресса. 
        </div>
      </div>
    </div>
  </div>
</div>