"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dirname = exports.useDirname = exports.DirnameCell = void 0;
const pipeline_1 = require("../core/pipeline");
exports.DirnameCell = pipeline_1.createCell('');
const useDirname = () => {
    let dirname = pipeline_1.useCell(exports.DirnameCell);
    return dirname;
};
exports.useDirname = useDirname;
const dirname = (input) => {
    return (request, next) => {
        let dirname = exports.useDirname();
        dirname.value = input;
        return next(request);
    };
};
exports.dirname = dirname;
