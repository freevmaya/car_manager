<?
    html::AddScriptFile("jquery-dateformat.min.js");
    html::AddScriptFile("main.js");
    html::AddScriptFile("map.js");
    html::AddScriptFile("views.js");
    //html::AddScriptFile("driver.js");
    //html::AddScriptFile("driver-manager.js");
    html::AddScriptFile("select-target.js");
    //html::AddScriptFile("notifications.js");
    
    html::AddScriptFile("https://code.jquery.com/ui/1.14.0/jquery-ui.js");

    html::AddStyleFile("https://code.jquery.com/ui/1.14.0/themes/base/jquery-ui.css");
    html::AddStyleFile('css/colors-01.css');
    html::AddStyleFile('css/cars.css');

    $carbodies = $dbp->asArray("SELECT *, 'Rajesh' AS `driver`, 'ER 131321 DF' AS `number` FROM `car_bodys`");
?>
<style type="text/css">
    .content > div {
        margin: 10px;
    }
</style>

<script type="text/javascript">

    $(window).ready(()=>{
        let cars = <?=json_encode($carbodies)?>;
        let tmpl = $('.templates .notify');
        for (let i in cars) {
            let item = templateClone(tmpl, cars[i]);

            const color = new Color();
            const solver = new Solver(color);
            const result = solver.solve();
            item.find('img')
                .attr('style', result.filter + ' drop-shadow(0px 0px 2px black)');
            $('.sliderView .slider').append(item);
        }
    });
</script>
<div class="templates">
    <div class="notify car">
        <div class="car-image-box chess light">
            <img class="car-image" src="css/images/{symbol}.png"></img>
            <span>{symbol}</span>
        </div>
        <button>{Go}</button>
        <div class="block">
            <div>Driver: {driver}</div>
            <div>Number: {number}</div>
        </div>
    </div>
</div>

<div id="windows">
  <div class="view shadow radiusTop" style="bottom: 0px;">
    <div class="title">
      <h3>Маршрут</h3>
      <button class="close button"></button>
    </div>

    <div class="footer btn-block sliderView">
      <div class="slider">
      </div>
    </div>
  </div>
</div>