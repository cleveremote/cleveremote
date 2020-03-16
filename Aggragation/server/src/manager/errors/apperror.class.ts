enum APP_ERROR_CODES {
    ERROR = 'error',
    MSISDN = 'msisdn',
    RUM = 'rum',
    CONFLICT = 'conflict'
}

export class AppError extends Error {

    public static HTTP_INTERNAL_ERROR = 500;
    public static HTTP_NOT_FOUND = 404;
    public static HTTP_BAD_REQUEST = 400;
    public static HTTP_FORBIDDEN = 403;
    public static HTTP_UNAUTHORIZED = 401;
    public static HTTP_OK = 200;
    public static HTTP_NO_CONTENT = 204;

    constructor(message: string, public status = AppError.HTTP_INTERNAL_ERROR, public code = APP_ERROR_CODES.ERROR, public data: {} = {}) {

        super(message);

        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        Error.captureStackTrace(this, this.constructor);
    }

}
