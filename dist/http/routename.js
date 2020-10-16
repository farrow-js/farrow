"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = exports.useRoutename = exports.useRoutenameCell = exports.RoutenameCell = void 0;
const pipeline_1 = require("../core/pipeline");
const basenames_1 = require("./basenames");
exports.RoutenameCell = pipeline_1.createCell('');
const useRoutenameCell = () => {
    let routenameCell = pipeline_1.useCell(exports.RoutenameCell);
    return routenameCell;
};
exports.useRoutenameCell = useRoutenameCell;
const useRoutename = () => {
    let routename = pipeline_1.useCellValue(exports.RoutenameCell);
    return routename;
};
exports.useRoutename = useRoutename;
const route = (name, middleware) => {
    return (request, next) => {
        let routename = exports.useRoutenameCell();
        if (!request.pathname.startsWith(name)) {
            return next();
        }
        let result = basenames_1.handleBasenames([name], request);
        let previous = routename.value;
        routename.value = previous + name;
        return middleware(result.request, (request) => {
            routename.value = previous;
            return next(request);
        });
    };
};
exports.route = route;
