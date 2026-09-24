import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { assessmentLimiter } from '../../middleware/rateLimiter';
import { createAssessmentSchema, listQuerySchema, idParamSchema } from './assessments.schema';
import * as controller from './assessments.controller';

const router = Router();

// Public preview (no auth, rate-limited) - useful for unauthenticated calculator
router.post('/preview', assessmentLimiter, validate({ body: createAssessmentSchema }), controller.preview);

// Protected
router.use(authenticate);

router.post('/', assessmentLimiter, validate({ body: createAssessmentSchema }), controller.create);
router.get('/', validate({ query: listQuerySchema }), controller.list);
router.get('/stats', controller.stats);
router.get('/:id', validate({ params: idParamSchema }), controller.getById);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

export default router;
