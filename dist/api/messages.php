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

    if (!$cfg) {
        ok(['demo' => true, 'folder' => $folder]);
    }

    if ($folder === 'sent') {
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $imap->connect();
        $imapFolder = $imap->getSentFolder();
        $imap->close();
    } elseif ($folder === 'trash') {
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $imap->connect();
        $imapFolder = $imap->getTrashFolder();
        $imap->close();
    } else {
        $imapFolder = 'INBOX';
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
        $folder = get('folder', 'inbox');
        if ($folder === 'sent') {
            $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
            $imap->connect();
            $folder = $imap->getSentFolder();
            $imap->close();
        } elseif ($folder === 'trash') {
            $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
            $imap->connect();
            $folder = $imap->getTrashFolder();
            $imap->close();
        } else {
            $folder = 'INBOX';
        }
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $msg  = $imap->getMessage($uid, $folder);
        ok(['demo' => false, 'message' => $msg]);
    } catch (Exception $e) {
        err($e->getMessage());
    }
}

// ── 从回收站恢复 ────────────────────────────
if ($method === 'POST' && get('action') === 'restore') {
    $uid = (int) str_replace('imap-', '', get('id'));
    $to  = get('to', 'INBOX');  // 恢复目标：inbox 或 sent
    if (!$cfg) ok(['demo' => true]);
    try {
        // 找 Trash 文件夹和目标文件夹
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $imap->connect();
        $trashFolder = $imap->getTrashFolder();
        if ($to === 'sent') {
            $toFolder = $imap->getSentFolder();
        } else {
            $toFolder = 'INBOX';
        }
        $imap->close();
        $imap->moveMessage($uid, $trashFolder, $toFolder);
        ok();
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

// ── 删除（移入 Trash）或永久删除 ─────────────
if ($method === 'DELETE') {
    $uid    = (int) str_replace('imap-', '', get('id'));
    $action = get('action', '');  // 'purge' = 永久删除，否则移到 Trash
    if (!$cfg) ok(['demo' => true]);
    try {
        $folder = get('folder', 'inbox');

        // 确定操作的源文件夹
        $imap = new ImapClient($cfg, $sess['email'], $sess['password']);
        $imap->connect();
        if ($folder === 'sent') {
            $srcFolder = $imap->getSentFolder();
        } elseif ($folder === 'trash') {
            $srcFolder = $imap->getTrashFolder();
        } else {
            $srcFolder = 'INBOX';
        }
        $imap->close();

        if ($action === 'purge') {
            // 从回收站永久删除
            $imap->purgeMessage($uid, $srcFolder);
        } else {
            // 移到回收站
            $imap->deleteMessage($uid, $srcFolder);
        }
        ok();
    } catch (Exception $e) {
        err($e->getMessage());
    }
}

err('无效请求', 400);
