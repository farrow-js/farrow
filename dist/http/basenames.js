"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBasenames = exports.route = exports.usePrefix = exports.useBasenamesCell = exports.useBasenames = exports.BasenamesCell = void 0;
const pipeline_1 = require("../core/pipeline");
exports.BasenamesCell = pipeline_1.createCell([]);
const useBasenames = () => {
    let basenames = pipeline_1.useCellValue(exports.BasenamesCell);
    return basenames;
};
exports.useBasenames = useBasenames;
const useBasenamesCell = () => {
    let basenamesCell = pipeline_1.useCell(exports.BasenamesCell);
    return basenamesCell;
};
exports.useBasenamesCell = useBasenamesCell;
const usePrefix = () => {
    let basenames = pipeline_1.useCellValue(exports.BasenamesCell);
    return basenames.join('');
};
exports.usePrefix = usePrefix;
const route = (name, middleware) => {
    return (request, next) => {
        let basenamesCell = exports.useBasenamesCell();
        if (!request.pathname.startsWith(name)) {
            return next();
        }
        let { basename, requestInfo } = exports.handleBasenames([name], request);
        let currentBasenames = basenamesCell.value;
        basenamesCell.value = [...currentBasenames, basename];
        return middleware(requestInfo, (request) => {
            basenamesCell.value = currentBasenames;
            return next(request);
        });
    };
};
exports.route = route;
const handleBasenames = (basenames, requestInfo) => {
    let { basename, pathname } = findBasename(basenames, requestInfo.pathname);
    let newRequestInfo = {
        ...requestInfo,
        pathname,
    };
    return {
        basename,
        requestInfo: newRequestInfo,
    };
};
exports.handleBasenames = handleBasenames;
const findBasename = (basenames, pathname) => {
    for (let basename of basenames) {
        if (!pathname.startsWith(basename))
            continue;
        let newPathname = pathname.replace(basename, '');
        if (!newPathname.startsWith('/')) {
            newPathname = '/' + newPathname;
        }
        return {
            basename,
            pathname: newPathname,
        };
    }
    return {
        basename: '',
        pathname,
    };
};
