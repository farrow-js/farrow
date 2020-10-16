"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const http_1 = require("../http");
const schema_1 = require("../core/schema");
const react_2 = require("../react");
const logger = (name) => async (request, next) => {
    let start = Date.now();
    let response = await next(request);
    let end = Date.now();
    let time = (end - start).toFixed(2);
    console.log(`[${name}]`, `path: ${request.pathname}, time: ${time}ms`);
    return response;
};
const home = http_1.createRouterPipeline({
    pathname: '/',
});
home.match('html', (body) => {
    return http_1.Response.html(`
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
    </head>
    <body>
      ${body.value}
    </body>
    </html>
`);
});
home.add(async (request) => {
    let prefix = http_1.usePrefix();
    return http_1.Response.html(`
    <h1>Home:${request.pathname}</h1>
    <ul>
      <li>
        <a href="${prefix}/detail/1">detail 1</a>
      </li>
      <li>
        <a href="${prefix}/detail/2">detail 2</a>
      </li>
      <li>
        <a href="${prefix}/detail/3">detail 3</a>
      </li>
      <li>
        <a href="${prefix}/detail/4">detail 4</a>
      </li>
      <li>
        <a href="${prefix}/detail/5">detail 5</a>
      </li>
      <li>
      <a href="${prefix}/detail/6">detail 6</a>
    </li>
    </ul>
  `);
});
const detail = http_1.createRouterPipeline({
    pathname: '/:detailId',
    params: schema_1.object({
        detailId: schema_1.number,
    }),
    query: schema_1.object({
        tab: schema_1.nullable(schema_1.string),
    }),
});
detail.add(async (request) => {
    let prefix = http_1.usePrefix();
    if (request.params.detailId > 4) {
        return http_1.Response.redirect(`/3?tab=from=${request.params.detailId}`);
    }
    return http_1.Response.json({
        prefix: prefix,
        pathname: request.pathname,
        detailId: request.params.detailId,
        tab: request.query.tab,
    });
});
const files = http_1.createRouterPipeline({
    pathname: '/static/:pathname*',
    params: schema_1.object({
        pathname: schema_1.list(schema_1.string),
    }),
});
files.add(async (request) => {
    let filename = request.params.pathname.join('/');
    return http_1.Response.file(path_1.default.join(__dirname, '..', filename));
});
const attachment = http_1.createRouterPipeline({
    pathname: '/src/index.js',
});
attachment.add(async () => {
    let filename = path_1.default.join(__dirname, '../index.js');
    return http_1.Response.file(filename).attachment('bundle.js');
});
const query = schema_1.object({
    a: schema_1.nullable(schema_1.number),
    b: schema_1.nullable(schema_1.string),
    c: schema_1.nullable(schema_1.boolean),
});
const View = (props) => {
    return (react_1.default.createElement("div", { id: "root" },
        react_1.default.createElement("h1", null, "Hello React"),
        react_1.default.createElement("div", { style: { fontSize: 18, color: 'red' } },
            react_1.default.createElement("pre", null, JSON.stringify(props, null, 2)))));
};
const react = http_1.createRouterPipeline({
    pathname: '/react',
    query: query,
});
react.add(async (request) => {
    let ReactView = react_2.useReactView();
    return ReactView.render(react_1.default.createElement(View, Object.assign({}, request))).header('view-engine', 'react');
});
const http = http_1.createHttpPipeline({
    basenames: ['/base'],
});
http.add(logger('test'));
http.add(home.middleware);
http.route('/detail', detail.middleware);
http.add(react.middleware);
http.add(attachment.middleware);
http.add(files.middleware);
const server = http.listen(3002, () => {
    console.log('server start at port: 3002');
});
