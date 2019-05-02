export class AppError extends Error {

    public static HTTP_INTERNAL_ERROR: number = 500;
    public static HTTP_NOT_FOUND: number = 404;
    public static HTTP_BAD_REQUEST: number = 400;
    public static HTTP_FORBIDDEN: number = 403;
    public static HTTP_UNAUTHORIZED: number = 401;
    public static HTTP_OK: number = 200;
    public static HTTP_NO_CONTENT: number = 204;

    
    constructor(message: string,
                public status: number = AppError.HTTP_INTERNAL_ERROR,
                public code: string = APP_ERROR_CODES.ERROR,
                public data: {} = {}) {

        super(message);

        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        Error.captureStackTrace(this, this.constructor);
    }

}

enum APP_ERROR_CODES {
    ERROR = 'error',
    MSISDN = 'msisdn',
    RUM = 'rum',
    CONFLICT = 'conflict'
}
