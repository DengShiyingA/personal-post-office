<?php
/**
 * IMAP 收信工具类
 * 依赖 PHP imap 扩展（宝塔面板 → 软件商店 → PHP → 安装扩展 → imap）
 */
class ImapClient {
    private $conn;
    private $host;
    private $port;
    private $ssl;
    private $email;
    private $password;

    public function __construct($cfg, $email, $password) {
        $this->host     = $cfg['host'];
        $this->port     = $cfg['imapPort'] ?? 993;
        $this->ssl      = $cfg['ssl'] ?? true;
        $this->email    = $email;
        $this->password = $password;
    }

    private function mailbox($folder = 'INBOX') {
        $flag = $this->ssl ? '/ssl/novalidate-cert' : '/notls';
        return '{' . $this->host . ':' . $this->port . '/imap' . $flag . '}' . $folder;
    }

    public function connect($folder = 'INBOX') {
        if (!function_exists('imap_open')) {
            throw new Exception('PHP imap 扩展未安装。请在宝塔面板 → PHP → 安装扩展 → 搜索 imap 安装。');
        }
        $this->conn = @imap_open($this->mailbox($folder), $this->email, $this->password);
        if (!$this->conn) {
            $err = imap_last_error();
            throw new Exception('IMAP 连接失败：' . $err);
        }
        return $this;
    }

    public function test() {
        try {
            $this->connect();
            $this->close();
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    // 获取邮件列表
    public function getMessages($folder = 'INBOX', $limit = 30) {
        $this->connect($folder);
        $total = imap_num_msg($this->conn);
        $start = max(1, $total - $limit + 1);
        $messages = [];

        for ($i = $total; $i >= $start; $i--) {
            $header  = imap_headerinfo($this->conn, $i);
            $uid     = imap_uid($this->conn, $i);

            $from = $this->decodeHeader($header->from[0] ?? null);
            $to   = $this->decodeHeader($header->to[0]   ?? null);

            $messages[] = [
                'id'       => 'imap-' . $uid,
                'uid'      => $uid,
                'folder'   => strtolower($folder) === 'inbox' ? 'inbox' : 'sent',
                'unread'   => ($header->Unseen  ?? '') === 'U',
                'starred'  => ($header->Flagged ?? '') === 'F',
                'from'     => $from['name'],
                'fromEmail'=> $from['email'],
                'to'       => $to['name'],
                'toEmail'  => $to['email'],
                'subject'  => $this->decodeSubject($header->subject ?? '（无主题）'),
                'date'     => date('c', strtotime($header->date ?? 'now')),
                'preview'  => '',
                'trackingId'=> null,
                'trackingStatus' => null,
            ];
        }
        $this->close();
        return $messages;
    }

    // 获取单封邮件完整内容
    public function getMessage($uid, $folder = 'INBOX') {
        $this->connect($folder);
        $body = $this->getBody($uid);
        imap_setflag_full($this->conn, $uid, '\\Seen', ST_UID);

        $header = imap_rfc822_parse_headers(imap_fetchheader($this->conn, $uid, FT_UID));
        $from   = $this->decodeHeader($header->from[0] ?? null);
        $to     = $this->decodeHeader($header->to[0]   ?? null);

        $msg = [
            'id'        => 'imap-' . $uid,
            'uid'       => $uid,
            'unread'    => false,
            'from'      => $from['name'],
            'fromEmail' => $from['email'],
            'to'        => $to['name'],
            'toEmail'   => $to['email'],
            'subject'   => $this->decodeSubject($header->subject ?? '（无主题）'),
            'body'      => $body,
            'date'      => date('c', strtotime($header->date ?? 'now')),
        ];
        $this->close();
        return $msg;
    }

    // 删除邮件（移到 Trash 回收站）
    public function deleteMessage($uid, $folder = 'INBOX') {
        // 先连接列出所有文件夹，找到 Trash 文件夹名
        $this->connect($folder);
        $trashFolder = $this->getTrashFolder();
        imap_mail_move($this->conn, (string)$uid, $trashFolder, CP_UID);
        imap_expunge($this->conn);
        $this->close();
    }

    // 移动邮件（从一个文件夹到另一个，用于恢复）
    public function moveMessage($uid, $fromFolder, $toFolder) {
        $this->connect($fromFolder);
        imap_mail_move($this->conn, (string)$uid, $toFolder, CP_UID);
        imap_expunge($this->conn);
        $this->close();
    }

    // 永久删除（从回收站真正清除）
    public function purgeMessage($uid, $trashFolder) {
        $this->connect($trashFolder);
        imap_delete($this->conn, $uid, FT_UID);
        imap_expunge($this->conn);
        $this->close();
    }

    // 标记已读
    public function markRead($uid) {
        $this->connect();
        imap_setflag_full($this->conn, $uid, '\\Seen', ST_UID);
        $this->close();
    }

    // ── 私有工具 ────────────────────────────

    private function getBody($uid) {
        $structure = imap_fetchstructure($this->conn, $uid, FT_UID);
        if (!isset($structure->parts)) {
            // 单部分
            $body = imap_body($this->conn, $uid, FT_UID);
            return $this->decode($body, $structure->encoding ?? 0);
        }
        // 多部分，取 text/plain 优先
        return $this->extractText($uid, $structure->parts, '');
    }

    private function extractText($uid, $parts, $prefix) {
        foreach ($parts as $idx => $part) {
            $partNum = $prefix ? $prefix . '.' . ($idx + 1) : (string)($idx + 1);
            if ($part->type === 0) { // text
                $subtype = strtolower($part->subtype);
                if ($subtype === 'plain') {
                    $raw = imap_fetchbody($this->conn, $uid, $partNum, FT_UID);
                    $text = $this->decode($raw, $part->encoding);
                    return $this->convertCharset($text, $part->parameters ?? []);
                }
            }
            if (isset($part->parts)) {
                $result = $this->extractText($uid, $part->parts, $partNum);
                if ($result) return $result;
            }
        }
        return '';
    }

    private function decode($text, $encoding) {
        switch ($encoding) {
            case 3: return base64_decode($text);
            case 4: return quoted_printable_decode($text);
            default: return $text;
        }
    }

    private function convertCharset($text, $params) {
        $charset = 'UTF-8';
        foreach ($params as $p) {
            if (strtolower($p->attribute) === 'charset') {
                $charset = strtoupper($p->value);
                break;
            }
        }
        if ($charset !== 'UTF-8') {
            $text = mb_convert_encoding($text, 'UTF-8', $charset);
        }
        return $text;
    }

    private function decodeSubject($subject) {
        $decoded = imap_mime_header_decode($subject);
        $result = '';
        foreach ($decoded as $part) {
            $text = $part->text;
            if ($part->charset && strtoupper($part->charset) !== 'UTF-8' && $part->charset !== 'default') {
                $text = mb_convert_encoding($text, 'UTF-8', $part->charset);
            }
            $result .= $text;
        }
        return $result;
    }

    private function decodeHeader($addr) {
        if (!$addr) return ['name' => '', 'email' => ''];
        $name = $addr->personal ?? '';
        if ($name) {
            $decoded = imap_mime_header_decode($name);
            $name = '';
            foreach ($decoded as $p) {
                $t = $p->text;
                if ($p->charset && strtoupper($p->charset) !== 'UTF-8' && $p->charset !== 'default') {
                    $t = mb_convert_encoding($t, 'UTF-8', $p->charset);
                }
                $name .= $t;
            }
        }
        $email = ($addr->mailbox ?? '') . '@' . ($addr->host ?? '');
        return ['name' => $name ?: $email, 'email' => $email];
    }

    // 自动检测回收站文件夹名
    public function getTrashFolder() {
        $candidates = ['Trash', 'INBOX.Trash', 'Deleted Items', 'Deleted Messages', '垃圾箱', '已删除', 'Junk'];
        $flag = $this->ssl ? '/ssl/novalidate-cert' : '/notls';
        $server = '{' . $this->host . ':' . $this->port . '/imap' . $flag . '}';
        $list = @imap_list($this->conn, $server, '*');
        if (!$list) return 'Trash';
        foreach ($candidates as $name) {
            foreach ($list as $folder) {
                if (stripos($folder, $name) !== false) {
                    return preg_replace('/^\{[^}]+\}/', '', $folder);
                }
            }
        }
        return 'Trash';
    }

    // 把邮件副本存入 Sent 文件夹（imap_append）
    public function appendToSent($sentFolder, $rawMsg) {
        $flag    = $this->ssl ? '/ssl/novalidate-cert' : '/notls';
        $server  = '{' . $this->host . ':' . $this->port . '/imap' . $flag . '}';
        $conn    = @imap_open($server . $sentFolder, $this->email, $this->password);
        if (!$conn) throw new Exception('IMAP append: 无法连接 ' . $sentFolder);
        imap_append($conn, $server . $sentFolder, $rawMsg, '\\Seen');
        imap_close($conn);
    }

    // 自动检测已发送文件夹名（不同服务器命名不同）
    public function getSentFolder() {
        $candidates = ['Sent', 'INBOX.Sent', 'Sent Items', '已发送', 'INBOX.Sent Items'];
        // 获取所有文件夹列表
        $list = @imap_list($this->conn, '{' . $this->host . ':' . $this->port . '/imap' . ($this->ssl ? '/ssl/novalidate-cert' : '/notls') . '}', '*');
        if (!$list) return 'Sent';
        foreach ($candidates as $name) {
            foreach ($list as $folder) {
                if (stripos($folder, $name) !== false) {
                    // 返回纯文件夹名（去掉 {server} 前缀）
                    return preg_replace('/^\{[^}]+\}/', '', $folder);
                }
            }
        }
        return 'Sent';
    }

    public function close() {
        if ($this->conn) {
            imap_close($this->conn);
            $this->conn = null;
        }
    }
}
