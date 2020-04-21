import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, finalize } from 'rxjs/operators';

export const genericRetryStrategy = ({
    maxRetryAttempts = 3000,
    durationBeforeRetry = 1000,
    excludedStatusCodes = []
}: {
    maxRetryAttempts?: number,
    durationBeforeRetry?: number,
    excludedStatusCodes?: number[]
} = {}) => (attempts: Observable<any>) =>
        attempts.pipe(
            mergeMap((error, i) => {
                const retryAttempt = i + 1;
                // if maximum number of retries have been met
                // or response is a status code we don't wish to retry, throw error
                if (
                    (retryAttempt > maxRetryAttempts ||
                        excludedStatusCodes.find(e => e === error.status)) && maxRetryAttempts !== -1
                ) {
                    return throwError(error);
                }
                // console.log(
                //     `Attempt ${retryAttempt}: retrying in ${durationBeforeRetry}ms`
                // );
                // retry after 1s, 2s, etc...
                return timer(durationBeforeRetry);
            })
            // ,
            // finalize(() => console.log('We are done!'))
        );
