"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pattern = exports.record = exports.literal = exports.union = exports.nullable = exports.object = exports.list = exports.boolean = exports.string = exports.number = exports.thunk = exports.is = exports.createType = exports.Ok = exports.Err = void 0;
const path_to_regexp_1 = require("path-to-regexp");
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
const createType = (options) => {
    let symbol = Symbol('KIND');
    let validate = options.validate;
    let is = (input) => {
        return input.kind === symbol;
    };
    let assert = (input) => {
        if (!is(input)) {
            throw new Error(`Unexpected value: ${input}`);
        }
    };
    let pipe = (options) => {
        return exports.createType({
            toJSON: options.toJSON,
            validate: (input) => {
                let result = validate(input);
                if (result.isErr)
                    return result;
                return options.validate(result.value);
            },
        });
    };
    let json;
    let props = {
        toJSON: () => {
            if (json === undefined) {
                json = options.toJSON();
            }
            return json;
        },
        validate,
        is,
        assert,
        pipe,
    };
    let schema = Object.assign((value) => {
        let result = validate(value);
        if (result.isErr) {
            throw new Error(result.value);
        }
        return {
            kind: symbol,
            value: result.value,
        };
    }, props);
    return schema;
};
exports.createType = createType;
const is = (input, Type) => {
    return Type.is(input);
};
exports.is = is;
const thunk = (f) => {
    let Type;
    let getType = () => {
        if (Type === undefined) {
            Type = f();
        }
        return Type;
    };
    return exports.createType({
        toJSON: () => {
            return getType().toJSON();
        },
        validate: (input) => {
            return getType().validate(input);
        },
    });
};
exports.thunk = thunk;
// tslint:disable-next-line: variable-name
exports.number = exports.createType({
    toJSON: () => {
        return 'number';
    },
    validate: (input) => {
        if (input === 'string') {
            let n = Number(input);
            if (!isNaN(n)) {
                input = n;
            }
        }
        if (typeof input === 'number') {
            return exports.Ok(input);
        }
        else {
            return exports.Err(`${input} is not a number`);
        }
    },
});
// tslint:disable-next-line: variable-name
exports.string = exports.createType({
    toJSON: () => {
        return 'string';
    },
    validate: (input) => {
        if (typeof input === 'string') {
            return exports.Ok(input);
        }
        else {
            return exports.Err(`${input} is not a string`);
        }
    },
});
// tslint:disable-next-line: variable-name
exports.boolean = exports.createType({
    toJSON: () => {
        return 'boolean';
    },
    validate: (input) => {
        if (input === 'true') {
            input = true;
        }
        else if (input === 'false') {
            input = false;
        }
        if (typeof input === 'boolean') {
            return exports.Ok(input);
        }
        else {
            return exports.Err(`${input} is not a boolean`);
        }
    },
});
const list = (ItemType) => {
    return exports.createType({
        toJSON: () => {
            return {
                type: 'List',
                itemType: ItemType.toJSON(),
            };
        },
        validate: (input) => {
            if (!Array.isArray(input)) {
                return exports.Err(`${input} is not a array`);
            }
            let list = [];
            for (let i = 0; i < input.length; i++) {
                let item = input[i];
                let result = ItemType.validate(item);
                if (result.isErr)
                    return result;
                list.push(result.value);
            }
            return exports.Ok(list);
        },
    });
};
exports.list = list;
const object = (fields) => {
    let Type = exports.createType({
        toJSON: () => {
            let list = Object.entries(fields).map(([key, Type]) => {
                return {
                    key,
                    type: Type.toJSON(),
                };
            });
            return {
                type: 'Object',
                fields: list,
            };
        },
        validate: (input) => {
            if (typeof input !== 'object') {
                return exports.Err(`${input} is not an object`);
            }
            if (input === null) {
                return exports.Err(`null is not an object`);
            }
            if (Array.isArray(input)) {
                return exports.Err(`${input} is not an object`);
            }
            let object = {};
            let source = input;
            for (let key in fields) {
                let FieldType = fields[key];
                let field = source[key];
                let result = FieldType.validate(field);
                if (result.isErr)
                    return result;
                object[key] = result.value;
            }
            return exports.Ok(object);
        },
    });
    return Type;
};
exports.object = object;
const nullable = (Type) => {
    return exports.createType({
        toJSON: () => {
            return {
                type: 'Nullable',
                contentType: Type.toJSON(),
            };
        },
        validate: (input) => {
            if (input === null) {
                return exports.Ok(input);
            }
            if (input === undefined) {
                return exports.Ok(input);
            }
            return Type.validate(input);
        },
    });
};
exports.nullable = nullable;
const union = (...Types) => {
    let Type = exports.createType({
        toJSON: () => {
            return {
                type: 'Union',
                contentTypes: Types.map((Type) => Type.toJSON()),
            };
        },
        validate: (input) => {
            for (let i = 0; i < Types.length; i++) {
                let Type = Types[i];
                let result = Type.validate(input);
                if (result.isOk)
                    return result;
            }
            return exports.Err(`${input} is not the union type`);
        },
    });
    return Type;
};
exports.union = union;
const literal = (literal) => {
    return exports.createType({
        shape: () => `Literal<${literal}>`,
        validate: (input) => {
            if (input === literal) {
                return exports.Ok(literal);
            }
            else {
                return exports.Err(`${input} is not equal to ${literal}`);
            }
        },
    });
};
exports.literal = literal;
const record = (Type) => {
    let ResultType = exports.createType({
        shape: () => `Record<string, ${Type.shape}>`,
        validate: (input) => {
            if (typeof input !== 'object') {
                return exports.Err(`${input} is not matched the shape: ${ResultType.shape}`);
            }
            if (input === null) {
                return exports.Err(`null is not matched the shape: ${ResultType.shape}`);
            }
            if (Array.isArray(input)) {
                return exports.Err(`${input} is not matched the shape: ${ResultType.shape}`);
            }
            let record = {};
            let source = input;
            for (let key in source) {
                let value = source[key];
                let result = Type.validate(value);
                if (result.isErr) {
                    return exports.Err(`object[${key}] is not matched the shape: ${Type.shape}`);
                }
                record[key] = result.value;
            }
            return exports.Ok(record);
        },
    });
    return ResultType;
};
exports.record = record;
const Pattern = (pattern, ParamsType) => {
    let match = path_to_regexp_1.match(pattern);
    return exports.string.pipe({
        shape: pattern,
        validate: (path) => {
            let matches = match(path);
            if (!matches) {
                return exports.Err(`${path} is not matched the pattern: ${pattern}`);
            }
            let params = matches.params;
            return ParamsType.validate(params);
        },
    });
};
exports.Pattern = Pattern;
const Json = exports.thunk('Json', () => {
    return exports.union(exports.number, exports.string, exports.boolean, exports.literal(null), exports.list(Json), exports.record(Json));
});
const Home = exports.Pattern('/home', exports.object({
    id: exports.number,
}));
const home = Home.validate('/home');
const TestUnion = exports.union(exports.literal('1 as const'), exports.literal(null));
const testUnion = TestUnion('1 as const');
const TestNullable = exports.nullable(TestUnion);
const testNullable = TestNullable(null);
const Todo = exports.object({
    id: exports.number,
    content: exports.string,
    completed: exports.boolean,
});
let n = exports.number(1);
const Todos = exports.list(Todo);
const Header = exports.object({
    text: exports.string,
});
const Footer = exports.object({
    filterType: exports.string,
});
const AppState = exports.object({
    header: Header,
    todos: Todos,
    footer: Footer,
});
const todos = Todos([
    {
        id: 0,
        content: '0',
        completed: false,
    },
    {
        id: 1,
        content: '1',
        completed: false,
    },
    {
        id: 2,
        content: '2',
        completed: false,
    },
]);
