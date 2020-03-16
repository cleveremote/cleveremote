// tslint:disable-next-line: no-default-import
import Controller from '../_controller';
import { Request, RequestHandler, Response, response } from 'express';
import { AppError } from '../../errors/apperror.class';
import { isAuthenticated } from '../../middleware/authentication';
import { IUser } from '../../interfaces/entities.interface';
import * as jwt from 'jsonwebtoken';

// tslint:disable-next-line: no-default-export
export default class Token extends Controller {

    @isAuthenticated()
    public get(req: Request, res: Response): void {
        const user = JSON.parse(JSON.stringify(req.user))as IUser;
        const token = jwt.sign(user,
            String(process.env.JWT_SECRET),
            { expiresIn: 200000 }
        );
        this.sendSuccess(res, { success: true, user, token, expiresIn: 200000 });
    }

}
