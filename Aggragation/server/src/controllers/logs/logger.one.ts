import Controller from '../_controller';
import { Request, Response } from 'express';
import { AppError } from '../../errors/appError.class';
import { Observable } from 'rxjs';
import { getRepository } from "typeorm";
import { async } from 'rxjs/internal/scheduler/async';
import Passport from '../../config/passport';
import * as jwt from 'jsonwebtoken';

import UserController from '../../api/controllers/userController';
import { Model } from 'mongoose';
import { IUserModel, UserModule } from '../../api/models/userModel';
import { isAuthenticated } from '../../middleware/authentication';
import XbeeService from '../../config/xbee';




class Logger extends Controller {

    public _params = ':device_id';
    
    @isAuthenticated()
    public get(req: Request, res: Response): void {
        XbeeService.GetNodeDiscovery().subscribe(function (frame) {
                console.log("Success!",frame);
            }, function (e) {
                console.log("Command failed:\n", e);
            });
        const userCtrl = new UserController<Model<IUserModel>>(UserModule);
        userCtrl.getAll(req, res);
        

    }
}

export default Logger;
