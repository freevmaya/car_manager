<?
class NotificationModel extends BaseModel {

	protected function getTable() {
		return 'notifications';
	}

	public function getItems($options) {
		GLOBAL $dbp;
		$optionCondition = '';
		if (isset($options['state'])) {
			if (is_array($options['state']))
				$optionCondition = "AND state IN ('".implode("','", $options['state'])."')";
		}

		$query = "SELECT * FROM {$this->getTable()} WHERE user_id={$options['user_id']} AND state = '{$options['state']}'";
		//trace($query);
		return $dbp->asArray($query);
	}
}