const express = require('express');
const ac = require('../controllers/accessController');
const al = require('../controllers/applicationLogsController');

const router = express.Router();

router.get('/', ac.isAllowed, al.getLogFileNames);
router.get('/:logname', ac.isAllowed, al.getFileContent);

module.exports = router;
