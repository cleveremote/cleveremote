import Controller from '../_controller';
import { Request, RequestHandler, Response, response } from 'express';
import { AppError } from '../../errors/appError.class';
import { isAuthenticated } from '../../middleware/authentication';
import { IUser } from '../../entities/interfaces/entities.interface';
import * as jwt from 'jsonwebtoken';


class Token extends Controller {

    @isAuthenticated()
    public get(req: Request, res: Response): void {
        const user = <IUser>JSON.parse(JSON.stringify(req.user));
        const token = jwt.sign(user,
            String(process.env.JWT_SECRET),
            { expiresIn: 3600 }
        );
        this.sendSuccess(res, { success: true, user, token, expiresIn: 3600 });
    }

}
export default Token;
