const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));
router.get('/orders', adminController.getOrders.bind(adminController));
router.put('/orders/:id/status', adminController.updateOrderStatus.bind(adminController));
router.get('/products', adminController.getProducts.bind(adminController));
router.post('/products', adminController.createProduct.bind(adminController));
router.put('/products/:id', adminController.updateProduct.bind(adminController));
router.delete('/products/:id', adminController.deleteProduct.bind(adminController));
router.get('/categories', adminController.getCategories.bind(adminController));
router.post('/categories', adminController.createCategory.bind(adminController));
router.put('/categories/:id', adminController.updateCategory.bind(adminController));
router.delete('/categories/:id', adminController.deleteCategory.bind(adminController));
router.get('/customers', adminController.getCustomers.bind(adminController));
router.get('/banners', adminController.getBanners.bind(adminController));
router.post('/banners', adminController.createBanner.bind(adminController));
router.put('/banners/:id', adminController.updateBanner.bind(adminController));
router.delete('/banners/:id', adminController.deleteBanner.bind(adminController));
router.get('/coupons', adminController.getCoupons.bind(adminController));
router.post('/coupons', adminController.createCoupon.bind(adminController));
router.delete('/coupons/:id', adminController.deleteCoupon.bind(adminController));
router.get('/reports/sales', adminController.getSalesReport.bind(adminController));
router.get('/settings', adminController.getSettings.bind(adminController));
router.put('/settings', adminController.updateSettings.bind(adminController));

module.exports = router;