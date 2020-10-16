"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBasenames = exports.useBasename = exports.BasenameCell = void 0;
const pipeline_1 = require("../core/pipeline");
exports.BasenameCell = pipeline_1.createCell([]);
const useBasename = () => {
    let basename = pipeline_1.useCellValue(exports.BasenameCell);
    return basename;
};
exports.useBasename = useBasename;
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
