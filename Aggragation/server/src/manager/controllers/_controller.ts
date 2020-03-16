// tslint:disable-next-line: file-name-casing
import * as express from 'express';
import { AppError } from '../errors/apperror.class';

// tslint:disable-next-line: no-default-export dynamic import
export default class Controller {

    public _params = '';

    public dispatch(req: express.Request, res: express.Response, next: any): void {
        switch (req.method) {
            case 'GET':
                this.get(req, res);
                break;
            case 'POST':
                this.post(req, res, next);
                break;
            case 'PUT':
                this.put(req, res);
                break;
            case 'DELETE':
                this.delete(req, res);
                break;
            default:
                res.sendStatus(AppError.HTTP_INTERNAL_ERROR);
        }
    }

    public get(req: express.Request, res: express.Response): void {
        res.sendStatus(AppError.HTTP_NOT_FOUND);
    }

    public post(req: express.Request, res: express.Response, next: any): void {
        res.sendStatus(AppError.HTTP_NOT_FOUND);
    }

    public put(req: express.Request, res: express.Response): void {
        res.sendStatus(AppError.HTTP_NOT_FOUND);
    }

    public delete(req: express.Request, res: express.Response): void {
        res.sendStatus(AppError.HTTP_NOT_FOUND);
    }

    public sendSuccess(res: express.Response, data?: any, code: number = AppError.HTTP_OK): void {
        res.status(code);
        res.send(data);
    }

    public sendError(res: express.Response, e: AppError): void {
        res.status(e.status || AppError.HTTP_INTERNAL_ERROR);
        res.send({
            message: e.message,
            trace: e.stack,
            code: e.code,
            data: e.data
        });
    }

}
