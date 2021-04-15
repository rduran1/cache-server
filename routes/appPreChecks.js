const appPreChecks = {};

appPreChecks.supportedBrowserCheck = (req, res, next) => {
	const ua = req.headers['user-agent'];
	if (typeof ua === 'undefined' || typeof ua !== 'string') return res.render('unsupportedBrowser');
	if (ua.indexOf('Edge') > 0 || ua.indexOf('Chrome') > 0) return next();
	return res.render('unsupportedBrowser');
};

appPreChecks.directBrowserToClearStaleSessionCookie = (req, res, next) => {
	if (req.cookies.user_sid && !req.session.accountId) {
		res.clearCookie('user_sid');
		return res.redirect('/app/login');
	}
	return next();
};

appPreChecks.checkForActiveSession = (req, res, next) => {
	if (req.path === '/login') return next();
	if (typeof req.session === 'undefined') return res.redirect('/app/login');
	if (typeof req.session.accountId === 'undefined') return res.redirect('/app/login');
	if (typeof req.cookies.user_sid === 'undefined') return res.redirect('/app/login');
	return next();
};

module.exports = appPreChecks;
