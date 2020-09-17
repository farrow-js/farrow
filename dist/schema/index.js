"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.Union = exports.List = exports.Nullable = exports.Boolean = exports.String = exports.Number = void 0;
const GlobalObject = Object;
// tslint:disable-next-line: variable-name
exports.Number = {
    kind: 'Number',
};
// tslint:disable-next-line: variable-name
exports.String = {
    kind: 'String',
};
// tslint:disable-next-line: variable-name
exports.Boolean = {
    kind: 'Boolean',
};
const Nullable = (type) => {
    return {
        kind: 'Nullable',
        type,
    };
};
exports.Nullable = Nullable;
const List = (type) => {
    return {
        kind: 'List',
        type,
    };
};
exports.List = List;
const Union = (...types) => {
    return {
        kind: 'Union',
        types,
    };
};
exports.Union = Union;
const isObject = (input) => {
    return !!(input && GlobalObject.prototype.toString.call(input) === '[object Object]');
};
const isLiteralType = (input) => {
    return typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean';
};
const isObjectType = (input) => {
    return !!(isObject(input) && !('kind' in input));
};
const isKindableType = (input) => {
    return /String|Number|Boolean|List|Union/.test(input === null || input === void 0 ? void 0 : input.kind);
};
const isNullableType = (input) => {
    return (input === null || input === void 0 ? void 0 : input.kind) === 'Nullable';
};
const verify = (schema, input, path = []) => {
    if (isLiteralType(schema)) {
        if (schema === input) {
            return {
                kind: 'Ok',
                value: input,
            };
        }
        else {
            return {
                kind: 'Err',
                schema,
                path,
                input,
                message: `Literal Schema: ${input} is not equal to ${schema}`,
            };
        }
    }
    if (isObjectType(schema)) {
        if (!isObject(input)) {
            return {
                kind: 'Err',
                schema,
                path,
                input,
                message: `Object Schema: ${input} is not an object with { ${Object.keys(schema)} }`,
            };
        }
        let object = {};
        for (let fieldName in schema) {
            let fieldSchema = schema[fieldName];
            let result = exports.verify(fieldSchema, input[fieldName], [...path, fieldName]);
            if (result.kind === 'Err') {
                return result;
            }
            ;
            object[fieldName] = result.value;
        }
        return {
            kind: 'Ok',
            value: object,
        };
    }
    if (isKindableType(schema)) {
        if (schema.kind === 'Boolean') {
            // parse boolean from string
            if (typeof input === 'string') {
                if (input === 'false') {
                    input = false;
                }
                else if (input === 'true') {
                    input = true;
                }
            }
            if (typeof input === 'boolean') {
                return {
                    kind: 'Ok',
                    value: input,
                };
            }
            else {
                return {
                    kind: 'Err',
                    schema,
                    path,
                    input,
                    message: `Boolean Schema: ${input} is not Boolean`,
                };
            }
        }
        if (schema.kind === 'Number') {
            // parsr number from string
            if (typeof input === 'string') {
                let num = parseFloat(input);
                if (!isNaN(num)) {
                    input = num;
                }
            }
            if (typeof input === 'number') {
                return {
                    kind: 'Ok',
                    value: input,
                };
            }
            else {
                return {
                    kind: 'Err',
                    schema,
                    path,
                    input,
                    message: `Number Schema: ${input} is not Number`,
                };
            }
        }
        if (schema.kind === 'String') {
            if (typeof input === 'string') {
                return {
                    kind: 'Ok',
                    value: input,
                };
            }
            else {
                return {
                    kind: 'Err',
                    schema,
                    path,
                    input,
                    message: `String Schema: ${input} is not String`,
                };
            }
        }
        if (schema.kind === 'List') {
            if (!Array.isArray(input)) {
                return {
                    kind: 'Err',
                    schema,
                    path,
                    input,
                    message: `List Schema: ${input} is not List`,
                };
            }
            let list = [];
            for (let i = 0; i < input.length; i++) {
                let result = exports.verify(schema.type, input[i], [...path, i.toString()]);
                if (result.kind === 'Err') {
                    return result;
                }
                list.push(result.value);
            }
            return {
                kind: 'Ok',
                value: list,
            };
        }
        if (schema.kind === 'Union') {
            for (let i = 0; i < schema.types.length; i++) {
                let result = exports.verify(schema.types[i], input, path);
                if (result.kind === 'Ok') {
                    return result;
                }
            }
            return {
                kind: 'Err',
                schema,
                path,
                input,
                message: `Union Schema: ${input} is not one of union types: ${JSON.stringify(schema.types)}`,
            };
        }
    }
    if (isNullableType(schema)) {
        if (input == null) {
            return {
                kind: 'Ok',
                value: input,
            };
        }
        return exports.verify(schema.type, input, path);
    }
    throw new Error(`Unknown schema: ${schema}`);
};
exports.verify = verify;
// const Todo = {
//   id: Number,
//   content: String,
//   completed: Boolean,
// }
// const TodoApp = {
//   header: {
//     text: String,
//   },
//   todos: List(Todo),
//   footer: {
//     filterType: Union('all', 'active', 'completed'),
//   },
//   a: Nullable(List(Todo)),
//   d: Union(false, 1),
// }
// type TodoAppType = RawType<typeof TodoApp>
// const todoState: TodoAppType = {
//   header: {
//     text: '123',
//   },
//   todos: [],
//   footer: {
//     filterType: 'all',
//   },
//   a: null,
//   d: false,
// }
// const result = verify(TodoApp, {
//   header: {
//     text: 'adf',
//   },
//   todos: [{ id: 0, content: '1', completed: 'false' }],
//   footer: {
//     filterType: 'completed',
//   },
//   d: 1,
//   f: 32,
//   e: 4,
// })
// console.log('result', result)
