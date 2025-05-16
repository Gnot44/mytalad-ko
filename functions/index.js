const admin = require('firebase-admin');
admin.initializeApp();

const { loginWithName } = require('./login');
const { autoDecreaseStockOnDeliveryWrite } = require('./stock');
const { notifyLineOnDelivery } = require('./notifyLine');

exports.loginWithName = loginWithName;
exports.autoDecreaseStockOnDeliveryWrite = autoDecreaseStockOnDeliveryWrite;
exports.notifyLineOnDelivery = notifyLineOnDelivery;
