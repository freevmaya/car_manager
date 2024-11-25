<?
class Directions {
	public $httpDebug = false;
	public $proxyConf = null;
	protected $base;

	public function __construct($base = 'https://maps.googleapis.com') {
		$this->base = $base;
	}

	protected static function placeToRequest($place) {
		return isset($place['placeId']) ? ('place_id:'.$place['placeId']): $place['lat'].','.$place['lng'];
	}

	public function getPath($start, $finish) {
		return $this->httpRequest('/maps/api/directions/json', 'GET', [
			'origin' => Directions::placeToRequest($start),
			'destination' => Directions::placeToRequest($finish),
			'key' => APIKEY
		]);
	}


	private function httpRequest( string $url, string $method = "GET", array $params = [], bool $signed = false ) {
      if( function_exists( 'curl_init' ) == false ) {
         throw new \Exception( "Sorry cURL is not installed!" );
      }
      
      $ch = curl_init();
      curl_setopt( $ch, CURLOPT_VERBOSE, $this->httpDebug );
      $query = http_build_query( $params, '', '&' );
      
      // signed with params
      if( $signed == true ) {
         if( empty( $this->api_key ) )
            throw new \Exception( "signedRequest error: API Key not set!" );
         if( empty( $this->api_secret ) )
            throw new \Exception( "signedRequest error: API Secret not set!" );
         $base = $this->base;
         $ts = ( microtime( true ) * 1000 ) + $this->info[ 'timeOffset' ];
         $params[ 'timestamp' ] = number_format( $ts, 0, '.', '' );
         if( isset( $params[ 'wapi' ] ) ) {
            unset( $params[ 'wapi' ] );
            $base = $this->wapi;
         }
         $query = http_build_query( $params, '', '&' );
         $signature = hash_hmac( 'sha256', $query, $this->api_secret );
         $endpoint = $base.$url;

         if ($method == "POST") $query .= '&signature='.$signature;
         else $endpoint .= '?'.$query.'&signature='.$signature;
         curl_setopt( $ch, CURLOPT_URL, $endpoint );
         curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 
               'X-MBX-APIKEY: ' . $this->api_key 
         ) );
      }
      // params so buildquery string and append to url
      else if( count( $params ) > 0 ) {
         curl_setopt( $ch, CURLOPT_URL, $this->base . $url . '?' . $query );
      }
      // no params so just the base url
      else {
         curl_setopt( $ch, CURLOPT_URL, $this->base . $url );
         curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 
               'X-MBX-APIKEY: ' . $this->api_key 
         ) );
      }
      curl_setopt( $ch, CURLOPT_USERAGENT, "User-Agent: Mozilla/4.0 (compatible; PHP Binance API)" );
      // Post and postfields
      if( $method == "POST" ) {
         curl_setopt( $ch, CURLOPT_POST, true );
         curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
      }
      // Delete Method
      if( $method == "DELETE" ) {
         curl_setopt( $ch, CURLOPT_CUSTOMREQUEST, $method );
      }
      // proxy settings
      if( is_array( $this->proxyConf ) ) {
         curl_setopt( $ch, CURLOPT_PROXY, $this->getProxyUriString() );
         if( isset( $this->proxyConf[ 'user' ] ) && isset( $this->proxyConf[ 'pass' ] ) ) {
            curl_setopt( $ch, CURLOPT_PROXYUSERPWD, $this->proxyConf[ 'user' ] . ':' . $this->proxyConf[ 'pass' ] );
         }
      }
      curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, true );
      // headers will proceed the output, json_decode will fail below
      curl_setopt( $ch, CURLOPT_HEADER, false );
      curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
      curl_setopt( $ch, CURLOPT_TIMEOUT, 60 );
      curl_setopt( $ch, CURLINFO_HEADER_OUT, true); //DEV
      curl_setopt( $ch, CURLOPT_REFERER, "taxicall.in");

      $output = curl_exec( $ch );
      // Check if any error occurred
      if( curl_errno( $ch ) > 0 ) {
         echo 'Curl error: ' . curl_error( $ch ) . "\n";
         return [];
      }
      $json = json_decode( $output, true );
      curl_close($ch);

      if(isset($json['msg']) || !$json) {
         echo "signedRequest error:\n{$output}".PHP_EOL;
         debug_print_backtrace(0, 5);
      }
      $len = strlen($output);
      if ($len == 0) {
        throw new Exception("Empty response data", 1); 
      }

      return $json;
	}	
}
?>