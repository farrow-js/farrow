export declare const BasenameCell: import("../core/pipeline").Cell<string[]>;
export declare const useBasename: () => string[];
export declare const handleBasenames: <T extends {
    pathname: string;
}>(basenames: string[], request: T) => {
    basename: string;
    request: T & {
        pathname: string;
    };
};
