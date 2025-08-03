import { Router } from 'express';
import { authenticate, adminOnly } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

// User management (admin only)
router.get('/', adminOnly, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Users management - full implementation pending', 
    data: [],
    note: 'User management will be implemented in next phase'
  });
});

router.post('/', adminOnly, (req, res) => {
  res.json({ 
    success: true, 
    message: 'User creation - full implementation pending',
    note: 'User creation will be implemented in next phase'
  });
});

export { router as usersRouter };