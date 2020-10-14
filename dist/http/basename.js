"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basename = exports.useBasename = exports.BasenameCell = void 0;
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
        let { basename, pathname } = findBasename(basenames, request.pathname);
        let newRequest = {
            ...request,
            pathname,
        };
        basenameCell.value = basename;
        return next(newRequest);
    };
};
exports.basename = basename;
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
