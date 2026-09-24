import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate =
  (schema: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query) as any;
      if (schema.params) req.params = schema.params.parse(req.params) as any;
      next();
    } catch (e) {
      next(e);
    }
  };

// Common sanitization: trim strings, limit lengths globally via Zod .max() per schema
