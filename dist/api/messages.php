<?php
/**
 * GET  /api/messages.php?folder=inbox|sent   → 邮件列表
 * GET  /api/messages.php?id=xxx              → 单封详情
 * DELETE /api/messages.php?id=xxx            → 删除
 * POST /api/messages.php?action=read&id=xxx  → 标记已读
 */
require '_helper.php';
require '_imap.php';

$sess   = require_session();
$cfg    = get_server_config();
$method = $_SERVER['REQUEST_METHOD'];

// ── 获取列表 ───────────────────────────────
if ($method === 'GET' && !get('id')) {
    $folder = get('folder', 'inbox');
    if ($folder === 'sent') {
        // 自动检测已发送文件夹名
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $imap->connect();
        $imapFolder = $imap->getSentFolder();
        $imap->close();
    } else {
        $imapFolder = 'INBOX';
    }

    if (!$cfg) {
        // 演示模式：读 localStorage 里的 Mock 数据（前端处理）
        ok(['demo' => true, 'folder' => $folder]);
    }

    try {
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $msgs = $imap->getMessages($imapFolder, 50);
        ok(['demo' => false, 'messages' => $msgs]);
    } catch (Exception $e) {
        err($e->getMessage());
    }
}

// ── 获取单封 ───────────────────────────────
if ($method === 'GET' && get('id')) {
    $uid = (int) str_replace('imap-', '', get('id'));
    if (!$cfg) ok(['demo' => true]);
    try {
        $folder = get('folder', 'INBOX');
        if ($folder === 'sent') {
            $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
            $imap->connect();
            $folder = $imap->getSentFolder();
            $imap->close();
        } elseif ($folder !== 'INBOX') {
            $folder = 'INBOX';
        }
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $msg  = $imap->getMessage($uid, $folder);
        ok(['demo' => false, 'message' => $msg]);
    } catch (Exception $e) {
        err($e->getMessage());
    }
}

// ── 标记已读 ───────────────────────────────
if ($method === 'POST' && get('action') === 'read') {
    $uid = (int) str_replace('imap-', '', get('id'));
    if (!$cfg) ok(['demo' => true]);
    try {
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $imap->markRead($uid);
        ok();
    } catch (Exception $e) {
        err($e->getMessage());
    }
}

// ── 删除 ───────────────────────────────────
if ($method === 'DELETE') {
    $uid = (int) str_replace('imap-', '', get('id'));
    if (!$cfg) ok(['demo' => true]);
    try {
        $folder = get('folder', 'INBOX');
        if ($folder === 'sent') {
            $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
            $imap->connect();
            $sentFolder = $imap->getSentFolder();
            $imap->close();
        } else {
            $sentFolder = 'INBOX';
        }
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $imap->deleteMessage($uid, $sentFolder);
        ok();
    } catch (Exception $e) {
        err($e->getMessage());
    }
}

err('无效请求', 400);
