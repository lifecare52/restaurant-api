import { Router } from 'express';

import orderMenuItemsRouter from './menu-items/order-menu-item.route';

const router = Router();

router.use('/menu-items', orderMenuItemsRouter);

export default router;
