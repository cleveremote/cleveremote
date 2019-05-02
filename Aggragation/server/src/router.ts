import * as express from 'express';
import Controller from './controllers/_controller';
import { RequestHandler } from 'express';

const app = express();

export class Router {

    private static fs = require('fs');

    private static METHODS : string[] = ['get', 'post', 'put', 'delete'];

    private static MIDDLEWARES_FILE_NAME : string = '_middlewares.js';

    public static getRouter () : Promise<express.Router> {
        return Router.generateRoute(__dirname + '/controllers/' );
    }

    private static async generateRoute (dir : string, path : string = '/', router : express.Router = express.Router()) : Promise<express.Router>{
        const files : string[] = Router.fs.readdirSync(dir);
        if(files.indexOf(Router.MIDDLEWARES_FILE_NAME) !== -1) {
            Router.setMasterMiddlewares(path, (await import(dir + Router.MIDDLEWARES_FILE_NAME)).default, router);
        }
        for (const file of files){
            if (Router.aviableFile(file)) { continue; }
            const impotedCtrl = await import(dir + file);
            const ctrl : Controller = new impotedCtrl.default();
            const routeName : string = Router.routeOfFile(path, file);
            if (Router.fs.statSync(dir + file).isDirectory()) {
                const params : string = (ctrl._params !== '') ? ctrl._params + '/' : '';
                await Router.generateRoute(dir + file + '/',path + file + '/' + params, router);
            } else {
                const params : string = (file.indexOf('.one') !== -1 ) ? '/' + ctrl._params : '';
                this.setMiddleware(routeName + params, ctrl, router);
                this.setController(routeName + params, ctrl, router);
            }
        }
        return router;
    }

    private static aviableFile (file : string) : boolean {
        return file[0] === '_' || file.indexOf('js.map') !== -1;
    }

    private static routeOfFile (path : string, file : string) {
        return path + file
            .replace('.js', '')
            .replace('.one', '');
    }

    private static setMasterMiddlewares(route : string, middleWare : RequestHandler[], router : express.Router){
        if (middleWare.length === 0 ) return;
        console.log('set Master Middlewares : ' + route);
        router.use(route, middleWare);
    }
    private static setMiddleware(route : string, ctrl : Controller, router : express.Router) {

        for(const method of this.METHODS) {
            if ((<any>ctrl)['__'+method+'Middleware'] && (<any>ctrl)['__'+method+'Middleware'].length) {
                (<any>router)[method](route, ...(<any>ctrl)['__'+method+'Middleware']);
            }
        }
    }

    private static setController(route : string, ctrl : Controller, router : express.Router) {
        for(const method of this.METHODS){
            (<any>router)[method](route, (req: express.Request, res: express.Response) => {
                (<any>ctrl)[method](req, res);
            });
        }
    }


}
