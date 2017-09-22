
import { NextFunction, Request, Response } from 'express';

export function setHeaders(req: Request, res: Response, next: NextFunction) {
  // CORS headers
  res.header('Access-Control-Allow-Origin', 'localhost:4200'); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
    // res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key,Origin,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
}