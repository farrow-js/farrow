"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("./http");
const router_1 = require("./http/router");
const schema_1 = require("./core/schema");
const pipeline_1 = require("./core/pipeline");
const dirname_1 = require("./http/dirname");
const basename_1 = require("./http/basename");
const logger = async (request, next) => {
    let start = Date.now();
    let response = await next(request);
    let end = Date.now();
    let time = (end - start).toFixed(2);
    console.log(`path: ${request.pathname}, time: ${time}ms`);
    return response;
};
const home = router_1.createRouterPipeline({
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
    let basename = basename_1.useBasename().value;
    return http_1.Response.html(`
    <h1>Home:${request.pathname}</h1>
    <ul>
      <li>
        <a href="${basename}/detail/1">detail 1</a>
      </li>
      <li>
        <a href="${basename}/detail/2">detail 2</a>
      </li>
      <li>
        <a href="${basename}/detail/3">detail 3</a>
      </li>
      <li>
        <a href="${basename}/detail/4">detail 4</a>
      </li>
      <li>
        <a href="${basename}/detail/5">detail 5</a>
      </li>
      <li>
      <a href="${basename}/detail/6">detail 6</a>
    </li>
    </ul>
  `);
});
const detail = router_1.createRouterPipeline({
    pathname: '/:detailId',
    params: schema_1.object({
        detailId: schema_1.number,
    }),
    query: schema_1.object({
        tab: schema_1.nullable(schema_1.string),
    }),
});
detail.add(async (request) => {
    let basename = basename_1.useBasename().value;
    let routename = http_1.useRoutename().value;
    if (request.params.detailId > 4) {
        return http_1.Response.redirect(`/3?tab=from=${request.params.detailId}`);
    }
    return http_1.Response.json({
        basename: basename,
        routename: routename,
        pathname: request.pathname,
        detailId: request.params.detailId,
        tab: request.query.tab,
    });
});
const files = router_1.createRouterPipeline({
    pathname: '/static/:pathname*',
    params: schema_1.object({
        pathname: schema_1.list(schema_1.string),
    }),
});
files.add(async (request) => {
    let filename = request.params.pathname.join('/');
    return http_1.Response.file(filename);
});
const attachment = router_1.createRouterPipeline({
    pathname: '/src/index.js',
});
attachment.add(async () => {
    return http_1.Response.file('index.js').attachment('bundle.js');
});
const HistoryCell = pipeline_1.createCell([]);
const useHistory = () => {
    let cell = pipeline_1.useCell(HistoryCell);
    return {
        push: (pathname) => {
            cell.value.push(pathname);
            console.log('history', cell.value);
        },
    };
};
const history = async (request, next) => {
    let history = useHistory();
    let response = await next();
    history.push(request.pathname);
    return response;
};
const app = http_1.createHttpPipeline({
    contexts: {
        history: HistoryCell.create([]),
        dirname: dirname_1.DirnameCell.create(__dirname),
    },
});
app.add(basename_1.basename('/base'));
app.add(logger);
app.add(history);
app.add(home.middleware);
app.route('/detail', detail.middleware);
app.add(attachment.middleware);
app.add(files.middleware);
const server = app.listen(3002, () => {
    console.log('server start at port: 3002');
});
