import { Router } from 'express';

import { getConstantsController } from '@modules/meta/meta.controller';

const router = Router();

router.get('/types', getConstantsController);

export default router;
