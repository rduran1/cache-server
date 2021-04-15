const crypto = require('crypto');
const express = require('express');

const router = express.Router();

const BAD_CREDENTIALS = 'Username or password is incorrect';

function presentLoginPage(req, res) {
	req.session.destroy();
	res.clearCookie('user_sid');
	res.render('login', { msg: '' });
}

function authenticateUser(req, res) {
	if (typeof req.body.accountId !== 'string') return res.render('login', { msg: BAD_CREDENTIALS });
	if (typeof req.body.password !== 'string') return res.render('login', { msg: BAD_CREDENTIALS });

	try {
		// Insert authentication mechanism
		const { accountId, password } = req.body;
		if (accountId !== 'rduran') throw new Error(BAD_CREDENTIALS);
		req.session.accountId = accountId;
		req.session.authkey = crypto.createHash('sha256').update(`${accountId}${password}`).digest('base64');
		return res.redirect('/app');
	} catch (e) {
		return res.render('login', { msg: e.message });
	}
}

router.get('/', presentLoginPage);
router.post('/', authenticateUser);

module.exports = router;
