<?
    html::$scripts[] = "jquery-dateformat.min.js";
    html::$scripts[] = "main.js";
    html::$scripts[] = "map.js";
    html::$scripts[] = "views.js";
    //html::$scripts[] = "driver.js";
    //html::$scripts[] = "driver-manager.js";
    html::$scripts[] = "select-target.js";
    //html::$scripts[] = "notifications.js";
    
    html::$scripts[] = "https://code.jquery.com/ui/1.14.0/jquery-ui.js";

    $this->styles[] = "https://code.jquery.com/ui/1.14.0/themes/base/jquery-ui.css";
    $this->styles[] = 'css/colors-01.css';
    $this->styles[] = 'css/cars.css';
?>

<script type="text/javascript">

    $('window').ready(()=>{

        let x = 0;
        let y = 0;
        let scale = 100;

        let cropimage = $('#cropimage');
        let imageSize = { x: cropimage.width(), y: cropimage.height() };

        function calculate(ax, ay, ascale) {
            let view = cropimage;

            x = ax;
            y = ay;
            scale = ascale;

            let viewSize = { x: cropimage.width(), y: cropimage.height() };
            let center = { x: viewSize.x / 2, y: viewSize.y / 2 };
            let k = Math.max(viewSize.x, viewSize.y);

            cropimage.css({
               'background-size': Math.round(scale * 100) + '%', 
               'background-position-x': -Math.round((x / 100 * viewSize.x * scale) - center.x),
               'background-position-y': -Math.round((y / 100 * viewSize.x * scale) - center.y)
            });
        }

        ($('#slider-x')).slider({
            min: 0,
            max: 100,
            slide: (e, ui) => {
                calculate(ui.value, y, scale);
            }
        });

        ($('#slider-y')).slider({
            min: 0,
            max: 100,
            slide: (e, ui) => {
                calculate(x, ui.value, scale);
            }
        });

        ($('#slider-scale')).slider({
            value: 5,
            min: 5,
            max: 100,
            slide: (e, ui) => {
                calculate(x, y, 100 / ui.value);
            }
        });



        ($('#slider-ix')).slider({
            min: 4,
            max: 20,
            slide: (e, ui) => {
                cropimage.css('width', ui.value + 'em');
                calculate(x, y, scale);
            }
        });



        ($('#slider-iy')).slider({
            min: 4,
            max: 20,
            slide: (e, ui) => {
                cropimage.css('height', ui.value + 'em');
                calculate(x, y, scale);
            }
        });
    });
</script>
<style type="text/css">
    .content > div {
        margin: 10px;
    }
</style>


<div class="content target-view">
  <div id="slider-x"></div>
  <div id="slider-y"></div>
  <div id="slider-scale"></div>
  <hr>
  <div id="slider-ix"></div>
  <div id="slider-iy"></div>
<div>


<div id="windows">
  <div class="view shadow radiusTop" style="bottom: 0px;">
    <div class="title">
      <h3>Маршрут</h3>
      <button class="close button"></button>
    </div>


    <div class="footer btn-block sliderView">
      <div class="slider">
        <!--
        <div class="slider-group">
            <button class="button" onclick="closeView($(this).parent('.slider-group'))">Отправить</button>
            <div class="datetime-field shadow datetime">Сейчас</div>
        </div>-->
        <div class="notify">
            <div class="car-image largecar" id="cropimage"></div>
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