const express = require('express');
const ac = require('../controllers/appController');

const router = express.Router();

router.use(ac.supportedBrowserCheck, ac.directBrowserToClearStaleSessionCookie, ac.checkForActiveSession);
router.get('/', ac.presentMainPage);
router.get('/login', ac.presentLoginPage);
router.post('/login', ac.authenticateUser);

module.exports = router;
