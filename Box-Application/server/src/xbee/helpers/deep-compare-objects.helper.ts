import { transform, isEqual, isObject } from "lodash/fp";

const _transform = transform.convert({
    cap: false
});

const iteratee = baseObj => (result, value, key) => {
    if (!isEqual(value, baseObj[key])) {
        const valIsObj = isObject(value) && isObject(baseObj[key]);
        result[key] = valIsObj === true ? differenceObject(value, baseObj[key]) : value;
    }
};

export function differenceObject(targetObj, baseObj) {
    return _transform(iteratee(baseObj), null, targetObj);
}