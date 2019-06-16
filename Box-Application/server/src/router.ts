import * as express from 'express';
// tslint:disable-next-line: no-default-import
import Controller from './controllers/_controller';
import * as fileSystem from 'fs';
const app = express();

export class Router {

    private static readonly fs = fileSystem;

    private static readonly METHODS: Array<string> = ['get', 'post', 'put', 'delete'];

    private static readonly MIDDLEWARES_FILE_NAME = '_middlewares.js';

    // tslint:disable-next-line: promise-function-async
    public static getRouter(): Promise<express.Router> {
        return Router.generateRoute(`${__dirname}/controllers/`);
    }

    // tslint:disable-next-line: max-line-length
    private static async generateRoute(dir: string, path = '/', router: express.Router = express.Router()): Promise<express.Router> {
        const files: Array<string> = Router.fs.readdirSync(dir);
        if (files.indexOf(Router.MIDDLEWARES_FILE_NAME) !== -1) {
            Router.setMasterMiddlewares(path, (await import(dir + Router.MIDDLEWARES_FILE_NAME)).default, router);
        }
        for (const file of files) {
            if (Router.aviableFile(file)) { continue; }
            const impotedCtrl = await import(dir + file);
            const ctrl: Controller = new impotedCtrl.default();
            const routeName: string = Router.routeOfFile(path, file);
            if (Router.fs.statSync(dir + file).isDirectory()) {
                const params: string = (ctrl._params !== '') ? `${ctrl._params}/` : '';
                await Router.generateRoute(`${dir}${file}/`, `${path}${file}/${params}`, router);
            } else {
                const params: string = (file.indexOf('.one') !== -1) ? `/${ctrl._params}` : '';
                Router.setMiddleware(routeName + params, ctrl, router);
                Router.setController(routeName + params, ctrl, router);
            }
        }

        return router;
    }

    private static aviableFile(file: string): boolean {
        return file[0] === '_' || file.indexOf('js.map') !== -1;
    }

    private static routeOfFile(path: string, file: string): string {
        return path + file
            .replace('.js', '')
            .replace('.one', '');
    }

    private static setMasterMiddlewares(route: string, middleWare: Array<express.RequestHandler>, router: express.Router): void {
        if (middleWare.length === 0) {
            return;
        }
        console.log(`set Master Middlewares : ${route}`);
        router.use(route, middleWare);
    }
    private static setMiddleware(route: string, ctrl: Controller, router: express.Router): void {

        for (const method of Router.METHODS) {
            if ((ctrl as any)[`__${method}Middleware`] && (ctrl as any)[`__${method}Middleware`].length) {
                (router as any)[method](route, ...(ctrl as any)[`__${method}Middleware`]);
            }
        }
    }

    private static setController(route: string, ctrl: Controller, router: express.Router): void {
        for (const method of Router.METHODS) {
            (router as any)[method](route, (req: express.Request, res: express.Response) => {
                (ctrl as any)[method](req, res);
            });
        }
    }
}
