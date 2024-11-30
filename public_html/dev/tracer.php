<?
class Tracer {
	public $pathIndex;
	public $routePos;
	public $routeAngle;
    public $distance;
    public $finished;

    protected $speed;
	protected $routes;
    protected $lengthList;

    protected $totalLength;
    protected $lastTime;

	public function __construct($route, $speed) {
		$this->route = $route;
		$this->speed = $speed;

		$this->Reset();
		$this->CalcPathLength();
		$this->setDistance(0);//rand(0, (int)$this->totalLength));
	}

	public function Reset() {
    	$this->lastTime = microtime(true);
    	$this->distance = 0;
    	$this->pathIndex = 0;
	}

    public function remaindDistance() {
        return $this->totalLength - $this->distance;
    }

    public function Update() {
    	$currentTime = microtime(true);

        if (!$this->finished) {
    		$step = ($currentTime - $this->lastTime) * $this->speed / 3.6;
    		$this->setDistance($this->distance + $step);
        }

    	$this->lastTime = $currentTime;
    }

    protected function CalcPathLength() {
    	$this->totalLength = 0;
    	$this->lengthList = [];
	    for ($i=0; $i < count($this->route) - 1; $i++) {
	        $d = Distance($this->route[$i]['lat'], $this->route[$i]['lng'], $this->route[$i + 1]['lat'], $this->route[$i + 1]['lng']);
	        $this->lengthList[] = $d;
	        $this->totalLength += $d; 
	    }
    }

    protected function setDistance($distance) {

    	if ($distance > $this->totalLength) {
    		$distance = $this->totalLength;
            $this->finished = true;
        }

    	$this->distance = $distance;
        $idx = 0;

        if ($distance < $this->totalLength) {
            if ($distance > 0) {
        		$this->distance = $distance;
                $d = 0;
                for ($i = 0; $i < count($this->lengthList); $i++) {
                    $l = $this->lengthList[$i];

                    if ($l + $d < $distance)
                        $d += $l;
                    else {
                        $p1 = $this->route[$i];
                        $p2 = $this->route[$i + 1];
                        $lk = ($distance - $d) / $l;

                        $this->pathIndex = $i;
                        $this->routeAngle = CalcAngle($p1, $p2);

                        $this->routePos = [
                            'lat' => $p1['lat'] + ($p2['lat'] - $p1['lat']) * $lk,
                        	'lng' => $p1['lng'] + ($p2['lng'] - $p1['lng']) * $lk
                        ];
                        return;
                    }
                }
            } else {
            	$this->distance = 0;
                $idx = 0;
                $this->routeAngle = CalcAngle($this->route[0], $this->route[1]);
            }
        } else {
            $this->finished = true;
        	$this->distance = $this->totalLength;
            $idx = count($this->route) - 1;
            $this->routeAngle = CalcAngle($this->route[$idx - 1], $this->route[$idx]);
        }

        $this->routePos = $this->route[$this->pathIndex = $idx];        
    }
}
?>