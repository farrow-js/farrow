"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBasenames = exports.basename = exports.useBasename = exports.BasenameCell = void 0;
const pipeline_1 = require("../core/pipeline");
exports.BasenameCell = pipeline_1.createCell('');
const useBasename = () => {
    let basename = pipeline_1.useCell(exports.BasenameCell);
    return basename;
};
exports.useBasename = useBasename;
const basename = (...basenames) => {
    return async (request, next) => {
        let basenameCell = pipeline_1.useCell(exports.BasenameCell);
        let result = exports.handleBasenames(basenames, request);
        basenameCell.value = result.basename;
        return next(result.request);
    };
};
exports.basename = basename;
const handleBasenames = (basenames, request) => {
    let { basename, pathname } = findBasename(basenames, request.pathname);
    let newRequest = {
        ...request,
        pathname,
    };
    return {
        basename,
        request: newRequest,
    };
};
exports.handleBasenames = handleBasenames;
const findBasename = (basenames, pathname) => {
    for (let i = 0; i < basenames.length; i++) {
        let basename = basenames[i];
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
