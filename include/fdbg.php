<?

$FDBGLogFile = LOGPATH.'fdbg.log';
$FDBGErrorsFile = LOGPATH.'errors.log';

define('ERROR_TYPE', 'error');
define('INFO_TYPE', 'info');

class fdbg {
    public static function trace($str, $topCalled=1, $type = INFO_TYPE) {
        GLOBAL $FDBGLogFile, $FDBGErrorsFile;

        $targetFile = $type == ERROR_TYPE ? $FDBGErrorsFile : $FDBGLogFile;
        
        $stack = fdbg::GetStack();
        if (!is_string($str)) $str = print_r($str, true);
                                                                                                                                
        $str = str_replace("'", '`', $str);
        $notify = [
            'time'=> date('d.m.y H.i'),
            'file'=> $stack[$topCalled]['file'],
            'line'=> $stack[$topCalled]['line'],
            'message'=>$str
        ];
        $notifyStr = json_encode($notify);

        if (file_exists($targetFile)) {
            $notifyStr = ",\n".$notifyStr;
            $line = filesize($targetFile);
        } else $line = 0;
        
        $fd = fopen($targetFile, 'a+');
        fwrite($fd, $notifyStr);
        fclose($fd);
        return $line;
    }
    
    public static function time() { 
        list($usec, $sec) = explode(" ", microtime()); 
        return ((float)$usec + (float)$sec); 
    }
    
    public static function callStackItem($depth=1) {
        $stack = fdbg::GetStack();
        return $stack[min($depth + 1, count($stack) - 1)];
    }
    
    public static function GetStack() {
        $stack = debug_backtrace();
        foreach ($stack as $key=>$val) {
            if (!isset($stack[$key]['file'])) unset($stack[$key]);  // ������� ������ ������
        }
        return $stack;
    }
}

function trace($value, $to='file', $callDepth=2, $asError = false) {
    switch ($to) {
        case 'document': echo '<pre>';
                        $line = fdbg::callStackItem($callDepth);
                        echo 'trace in file: '.$line['file'].', line: '.$line['line']."\n";
                        print_r($value); 
                        echo '</pre>';
                        break;
        case 'file': fdbg::trace($value, $callDepth, $asError);
                    break;
        default : $line = fdbg::callStackItem($callDepth);
                    echo 'trace in file: '.$line['file'].', line: '.$line['line']."\n";
                    print_r($value);
                    break;
    }
}
?>