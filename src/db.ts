import { Request, Response } from 'express';

export interface User {
  name: string,
  role: string,
  username: string
}

// TODO: Mongonize this:
export function userAvailable(req: Request, res: Response){
  const username:string = req.query.username;
  if(username !== 'yorch'){
    res.json({username: username, available: true});
  }else{
    res.json({username: username, available: false});
  }
}