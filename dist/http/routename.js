"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = exports.useRoutename = exports.RoutenameCell = void 0;
const pipeline_1 = require("../core/pipeline");
const basename_1 = require("./basename");
exports.RoutenameCell = pipeline_1.createCell('');
const useRoutename = () => {
    let routename = pipeline_1.useCell(exports.RoutenameCell);
    return routename;
};
exports.useRoutename = useRoutename;
const route = (name, middleware) => {
    return (request, next) => {
        let routename = exports.useRoutename();
        if (!request.pathname.startsWith(name)) {
            return next();
        }
        let result = basename_1.handleBasenames([name], request);
        let previous = routename.value;
        routename.value = previous + name;
        return middleware(result.request, (request) => {
            routename.value = previous;
            return next(request);
        });
    };
};
exports.route = route;
