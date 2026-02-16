import { Router } from 'express';
import menuItemsRouter from './menu-items/menu-item.route';
import variationsRouter from './variations/variation.route';
import menuItemVariantsRouter from './menu-item-variants/menu-item-variant.route';
import addonsRouter from './addons/addon.route';
import menuItemAddonsRouter from './menu-item-addons/menu-item-addon.route';
import categoriesRouter from './category/category.route';

const router = Router();

router.use('/menu-items', menuItemsRouter);
router.use(variationsRouter);
router.use(menuItemVariantsRouter);
router.use(addonsRouter);
router.use(menuItemAddonsRouter);
router.use(categoriesRouter);

export default router;
