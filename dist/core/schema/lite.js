"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromLiteSchema = void 0;
const Schema = __importStar(require("./index"));
const isLiteNullable = (input) => {
    return !!(input && input.__kind === 'nullable');
};
const isLiteUnion = (input) => {
    return !!(input && input.__kind === 'union');
};
const isNull = (input) => {
    return input === null;
};
const isNumberConstructor = (input) => {
    return input === Number;
};
const isStringConstructor = (input) => {
    return input === String;
};
const isBooleanConstructor = (input) => {
    return input === Boolean;
};
const isLiteList = (input) => {
    return Array.isArray(input) && input.length === 1;
};
const isLiteTuple = (input) => {
    return Array.isArray(input) && input.length !== 1;
};
const isLiteObject = (input) => {
    return !!(input && !Array.isArray(input) && typeof input === 'object');
};
const isNumber = (input) => {
    return typeof input === 'number';
};
const isString = (input) => {
    return typeof input === 'string';
};
const isBoolean = (input) => {
    return typeof input === 'boolean';
};
function fromLiteSchema(schema) {
    if (isStringConstructor(schema)) {
        return 'Schema.string';
    }
    if (isNull(schema)) {
        let value = schema;
        return Schema.literal(value);
    }
    if (schema === Number) {
        return Schema.number;
    }
    if (schema === Boolean) {
        return Schema.boolean;
    }
    if (isLiteNullable(schema)) {
        let Type = fromLiteSchema(schema.type);
        return Schema.nullable(Type);
    }
    if (isLiteUnion(schema)) {
        let types = schema.types.map(fromLiteSchema);
        return Schema.union(...types);
    }
    if (Array.isArray(schema)) {
        let itemType = fromLiteSchema(schema[0]);
        return Schema.list(itemType);
    }
    if (typeof schema === 'object') {
        let fields = {};
        for (let key in schema) {
            let field = schema[key];
            fields[key] = fromLiteSchema(field);
        }
        return Schema.object(fields);
    }
    if (typeof schema === 'string' || typeof schema === 'number' || typeof schema === 'boolean') {
        let value = schema;
        return Schema.literal(value);
    }
    throw new Error(`Unknown schema: ${schema}`);
}
exports.fromLiteSchema = fromLiteSchema;
let t1 = fromLiteSchema({
    union: true,
    types: [String, Boolean],
});
let t0 = fromLiteSchema({
    k: {
        nullable: true,
        type: '123',
    },
    l: {
        union: true,
        types: [String, Boolean],
    },
    h: {
        __kind: 'union',
        types: [String, Boolean],
    },
    a: String,
    b: Boolean,
    c: [Number],
    d: {
        f: null,
        g: 1,
        h: '1',
        i: false,
    },
});
