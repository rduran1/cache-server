const express = require('express');

const router = express.Router();

function presentMainPage(req, res) {
	res.render('main');
}

router.get('/', presentMainPage);

module.exports = router;
