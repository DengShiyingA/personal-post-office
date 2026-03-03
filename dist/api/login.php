<?php
/**
 * POST /api/login.php
 * body: { email, password }
 * 成功: { ok: true, data: { token, user } }
 */
require '_helper.php';
require '_imap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') err('仅支持 POST', 405);

$body     = body();
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if (!$email || !$password) err('请填写邮箱和密码');

$cfg = get_server_config();

// 未配置服务器 → 返回演示模式标记
if (!$cfg) {
    $name = explode('@', $email)[0];
    $name = ucfirst($name);
    ok([
        'token' => 'demo-' . md5($email),
        'demo'  => true,
        'user'  => ['email' => $email, 'name' => $name, 'avatar' => strtoupper($name[0])]
    ]);
}

// 已配置 → 用 IMAP 验证
try {
    $imap = new ImapClient($cfg, $email, $password);
    $result = $imap->test();
    if (!$result['success']) {
        $raw = strtolower($result['message'] ?? '');
        if (preg_match('/no such user|user.{0,15}(exist|found)|unknown user|invalid user|用户不存在/i', $raw)) {
            err('该账号不存在，请检查邮箱地址是否正确');
        }
        err('密码错误，请重试');
    }

    $token = create_session($email, $password);
    $name  = explode('@', $email)[0];
    $name  = ucfirst($name);
    ok([
        'token' => $token,
        'demo'  => false,
        'user'  => ['email' => $email, 'name' => $name, 'avatar' => strtoupper($name[0])]
    ]);
} catch (Exception $e) {
    err($e->getMessage());
}
