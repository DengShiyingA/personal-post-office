<?php
/**
 * SMTP 发信类（纯 PHP Socket，无需第三方库）
 */
class SmtpClient {
    private $host;
    private $port;
    private $ssl;
    private $email;
    private $password;
    private $sock;

    public function __construct($cfg, $email, $password) {
        $this->host     = $cfg['host'];
        $this->port     = $cfg['smtpPort'] ?? 465;
        $this->ssl      = $cfg['ssl'] ?? true;
        $this->email    = $email;
        $this->password = $password;
    }

    public function send($to, $toEmail, $subject, $body) {
        $this->connect();
        $this->auth();
        $this->sendMail($to, $toEmail, $subject, $body);
        $this->quit();
    }

    public function test() {
        try {
            $this->connect();
            $this->auth();
            $this->quit();
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function connect() {
        $addr = ($this->ssl ? 'ssl://' : '') . $this->host . ':' . $this->port;
        $ctx  = stream_context_create(['ssl' => [
            'verify_peer'       => false,
            'verify_peer_name'  => false,
            'allow_self_signed' => true,
        ]]);
        $this->sock = @stream_socket_client($addr, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
        if (!$this->sock) {
            throw new Exception("SMTP 连接失败：$errstr ($errno)");
        }
        stream_set_timeout($this->sock, 10);
        $this->expect('220');
        $this->cmd('EHLO ' . gethostname());
        $this->expect('250');

        // STARTTLS（非 SSL 端口）
        if (!$this->ssl && $this->port == 587) {
            $this->cmd('STARTTLS');
            $this->expect('220');
            stream_socket_enable_crypto($this->sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $this->cmd('EHLO ' . gethostname());
            $this->expect('250');
        }
    }

    private function auth() {
        $this->cmd('AUTH LOGIN');
        $this->expect('334');
        $this->cmd(base64_encode($this->email));
        $this->expect('334');
        $this->cmd(base64_encode($this->password));
        $this->expect('235');
    }

    private function sendMail($to, $toEmail, $subject, $body) {
        $this->cmd("MAIL FROM:<{$this->email}>");
        $this->expect('250');

        $this->cmd("RCPT TO:<{$toEmail}>");
        $this->expect('250');

        $this->cmd('DATA');
        $this->expect('354');

        $date    = date('r');
        $msgId   = '<' . time() . '.' . rand(1000, 9999) . '@' . $this->host . '>';
        $subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $fromName = '=?UTF-8?B?' . base64_encode('个人邮局') . '?=';
        $toName   = '=?UTF-8?B?' . base64_encode($to) . '?=';
        $bodyEncoded = base64_encode($body);

        $headers  = "Date: $date\r\n";
        $headers .= "From: $fromName <{$this->email}>\r\n";
        $headers .= "To: $toName <{$toEmail}>\r\n";
        $headers .= "Subject: $subjectEncoded\r\n";
        $headers .= "Message-ID: $msgId\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Content-Transfer-Encoding: base64\r\n";
        $headers .= "\r\n";
        $headers .= chunk_split($bodyEncoded);
        $headers .= "\r\n.";

        $this->cmd($headers);
        $this->expect('250');
    }

    private function quit() {
        $this->cmd('QUIT');
        fclose($this->sock);
        $this->sock = null;
    }

    private function cmd($str) {
        fwrite($this->sock, $str . "\r\n");
    }

    private function expect($code) {
        $response = '';
        while ($line = fgets($this->sock, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        if (substr(trim($response), 0, 3) !== $code) {
            throw new Exception("SMTP 错误（期望 $code）：" . trim($response));
        }
        return $response;
    }
}
