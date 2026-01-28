import { Router } from 'express';

import { getConstantsController } from './meta.controller';

const router = Router();

router.get('/types', getConstantsController);

export default router;
