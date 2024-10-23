<?
    $this->scripts[] = "jquery-dateformat.min.js";
    $this->scripts[] = "main.js";
    $this->scripts[] = "map.js";
    $this->scripts[] = "color.js";
    $this->scripts[] = "views.js";
    //$this->scripts[] = "driver.js";
    //$this->scripts[] = "driver-manager.js";
    $this->scripts[] = "select-target.js";
    //$this->scripts[] = "notifications.js";
    
    $this->scripts[] = "https://code.jquery.com/ui/1.14.0/jquery-ui.js";

    $this->styles[] = "https://code.jquery.com/ui/1.14.0/themes/base/jquery-ui.css";
    $this->styles[] = 'css/cars.css';

    $carbodies = $this->dbp->asArray("SELECT *, 'Rajesh' AS `driver`, 'ER 131321 DF' AS `number` FROM `car_bodys`");
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
        </div>
        <button>{Go}</button>
        <div class="block">
            <div>{symbol}</div>
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