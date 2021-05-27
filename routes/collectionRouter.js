const router = require('express').Router();
const accessController = require('../controllers/accessController');
const collectionController = require('../controllers/collectionController');

router.get('/all-metadata', accessController.isAllowed, collectionController.getAllMetaData);
router.get('/all-service-accounts', accessController.isAllowed, collectionController.getAllServiceAccounts);
router.get('/all-tokens', accessController.isAllowed, collectionController.getAllTokens);

router.get('/metadata/:name', accessController.isAllowed, collectionController.getMetaDataByName);
router.get('/service-account/:name', accessController.isAllowed, collectionController.getServiceAccountByName);
router.get('/token/:alias', accessController.isAllowed, collectionController.getTokenByAlias);

router.get('/dataset/:name', accessController.isAllowed, collectionController.getDataSetByName);

router.post('/create-metadata/:name', accessController.isAllowed, collectionController.createMetaData);
router.post('/create-service-account/:name', accessController.isAllowed, collectionController.createServiceAccount);
router.post('/create-token', accessController.isAllowed, collectionController.createToken);

router.put('/update-metadata/:name', accessController.isAllowed, collectionController.updateMetaData);
router.put('/update-server-account/:name', accessController.isAllowed, collectionController.updateServiceAccount);
router.put('/update-token/:alias', accessController.isAllowed, collectionController.updateToken);

router.put('/start/:name', accessController.isAllowed, collectionController.startCollection);
router.put('/stop/:name', accessController.isAllowed, collectionController.stopCollection);

router.delete('/delete-metadata/:name', accessController.isAllowed, collectionController.deleteMetaData);
router.delete('/delete-service-account/:name', accessController.isAllowed, collectionController.deleteServiceAccount);
router.delete('delete-token/:alias', accessController.isAllowed, collectionController.deleteToken);

router.post('/dataset/:name', accessController.isAllowed, collectionController.saveDataStream);

module.exports = router;
