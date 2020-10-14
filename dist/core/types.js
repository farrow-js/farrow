"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ok = exports.Err = void 0;
const Err = (value) => {
    let err = {
        kind: 'Err',
        value,
        isErr: true,
        isOk: false,
    };
    return err;
};
exports.Err = Err;
const Ok = (value) => {
    let ok = {
        kind: 'Ok',
        value,
        isErr: false,
        isOk: true,
    };
    return ok;
};
exports.Ok = Ok;
