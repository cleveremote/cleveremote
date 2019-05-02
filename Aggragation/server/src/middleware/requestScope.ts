import {Request, Response, NextFunction} from 'express';
import { current } from 'node-zone';

export default class RequestScope {

    public static middleware (req : Request, res : Response, next: NextFunction) : void  {
        const requestContext = {req, res};
        current
            .fork({ name: 'request-context', properties: { requestContext } })
            .run(() => {
                next();
            });
    }

}
