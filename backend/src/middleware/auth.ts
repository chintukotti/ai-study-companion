import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, createUserClient } from '../lib/supabase.js';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
      supabase?: ReturnType<typeof createUserClient>;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    return;
  }

  req.user = user;
  req.token = token;
  req.supabase = createUserClient(token);
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, async () => {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();
      
    if (profile?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }
    next();
  });
};
