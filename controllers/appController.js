const crypto = require('crypto');
const bf = require('../services/bigfixService');
// const logger = require('../services/loggingService')(__filename);

const appController = {};

const BAD_CREDENTIALS = 'Username or password is incorrect';

appController.presentMainPage = (req, res) => {
	res.render('main');
};

appController.presentLoginPage = (req, res) => {
	req.session.destroy();
	res.clearCookie('user_sid');
	res.render('login', { msg: '' });
};

appController.authenticateUser = async (req, res) => {
	if (typeof req.body.accountId !== 'string') return res.render('login', { msg: BAD_CREDENTIALS });
	if (typeof req.body.password !== 'string') return res.render('login', { msg: BAD_CREDENTIALS });
	const { accountId, password } = req.body;
	try {
		const authenticated = await bf.authenticate({ username: accountId, password });
		if (!authenticated) throw new Error(BAD_CREDENTIALS);
		req.session.accountId = accountId;
		req.session.authkey = crypto.createHash('sha256').update(`${accountId}${password}`).digest('base64');
		return res.redirect('/app');
	} catch (e) {
		let emsg = '';
		if (/clientRequest error: connect ECONNREFUSED/.test(e.message)) emsg = 'Authenticating Bigfix Root Server unavailable';
		emsg = e.message;
		return res.render('login', { msg: emsg });
	}
};

appController.supportedBrowserCheck = (req, res, next) => {
	const ua = req.headers['user-agent'];
	if (typeof ua === 'undefined' || typeof ua !== 'string') return res.render('unsupportedBrowser');
	if (ua.indexOf('Edge') > 0 || ua.indexOf('Chrome') > 0) return next();
	return res.render('unsupportedBrowser');
};

appController.directBrowserToClearStaleSessionCookie = (req, res, next) => {
	if (req.cookies.user_sid && !req.session.accountId) {
		res.clearCookie('user_sid');
		return res.redirect('/app/login');
	}
	return next();
};

appController.checkForActiveSession = (req, res, next) => {
	if (req.path === '/login') return next();
	if (typeof req.session === 'undefined') return res.redirect('/app/login');
	if (typeof req.session.accountId === 'undefined') return res.redirect('/app/login');
	if (typeof req.cookies.user_sid === 'undefined') return res.redirect('/app/login');
	return next();
};

module.exports = appController;
