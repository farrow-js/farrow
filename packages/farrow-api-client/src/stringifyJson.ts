const stringifyJsonWeakMap = new WeakMap<object, string>();

export const stringifyJson = (json: any) => {

    if (stringifyJsonWeakMap.has(json)) {
        return stringifyJsonWeakMap.get(json)!;
    }

    const str = JSON.stringify(json);

    stringifyJsonWeakMap.set(json, str);

    return str;
};
