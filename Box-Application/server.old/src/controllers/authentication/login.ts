// tslint:disable-next-line: no-default-import
import Controller from '../_controller';
import { Request, RequestHandler, Response, response } from 'express';
import { AppError } from '../../errors/apperror.class';
import { authenticate } from '../../middleware/authentication';

// tslint:disable-next-line: no-default-export
export default class Login extends Controller {

    @authenticate()
    public post(req: Request, res: Response, next: any): void {
        if (res.locals && res.locals.authentication) {
            this.sendSuccess(res, res.locals.authentication);
        }
    }

}
