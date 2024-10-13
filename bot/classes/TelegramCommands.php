<?

include(dirname(__FILE__)."/BaseController.php");

class TelegramCommands extends BaseController {

	protected $request;

	public function Exec() {
		$params = explode(" ", $this->request['text']);
		if ((count($params) > 0) && ($params[0][0] == '/')) {

			$method = '_'.substr($params[0], 1);
			if (method_exists($this, $method)) {
				$this->send($this->$method($params));
			} else $this->send($this->_help());

		} else $this->send($this->_help());
	}

	protected function _help() {
		return sprintf(Lang("Hello, %s %s here are the commands that I understand"),
			$this->request['from']['first_name'], $this->request['from']['last_name']).":\n".
				Lang("/help - list commands")."\n".
				Lang("/to - where to take you?")."\n".
				Lang("/from - where should I pick you up from?");
	}

	protected function _to($params) {
		if (count($params) > 1) {
			return $params[1];
		}
		return Lang("Where are you going?");
	}

	protected function _from($params) {
		if (count($params) > 1) {
			return $params[1];
		}
		return Lang("Where should I pick you up from?");
	}

	protected function _lang($params) {
		if (count($params) > 1) {
			$this->setc("language", $params[1]);
			return Lang("Successful!");
		}
		return Lang("Select language");
	}

	protected function send($text) {
		if (DEV)
			echo $text;
		else $this->sendToTelegram($text);
	}

	protected function sendToTelegram($text, $reply_markup = '')
	{
		if (DEV)
			print_r($text);
		else {
		    $ch = curl_init();
		    $ch_post = [
		        CURLOPT_URL => 'https://api.telegram.org/bot'.BOTTOKEN.'/sendMessage',
		        CURLOPT_POST => TRUE,
		        CURLOPT_RETURNTRANSFER => TRUE,
		        CURLOPT_TIMEOUT => 10,
		        CURLOPT_POSTFIELDS => [
		            'chat_id' => $this->request['from']['id'],
		            'parse_mode' => 'HTML',
		            'text' => $text,
		            'reply_markup' => $reply_markup,
		        ]
		    ];

		    curl_setopt_array($ch, $ch_post);
		    curl_exec($ch);
		}
	}
}
?>