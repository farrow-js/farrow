"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("./http");
const responser_1 = require("./http/responser");
const router_1 = require("./http/router");
const schema_1 = require("./core/schema");
const pipeline_1 = require("./core/pipeline");
const logger = async (request, next) => {
    let start = Date.now();
    let response = await next(request);
    let end = Date.now();
    let time = (end - start).toFixed(2);
    console.log(`path: ${request.pathname}, time: ${time}ms`);
    return response;
};
const NotFound = () => {
    return responser_1.status({
        code: 404,
    });
};
const home = router_1.createRouterPipeline({
    pathname: '/',
});
home.add(async (request, next) => {
    let response = await next(request);
    if (!responser_1.html.is(response)) {
        return response;
    }
    return responser_1.html(`
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
    </head>
    <body>
      ${response.value}
    </body>
    </html>
  `);
});
home.add(async (request) => {
    return responser_1.html(`
    <h1>Home:${request.pathname}</h1>
    <ul>
      <li>
        <a href="/detail/1">detail 1</a>
      </li>
      <li>
        <a href="/detail/2">detail 2</a>
      </li>
      <li>
        <a href="/detail/3">detail 3</a>
      </li>
    </ul>
  `);
});
const detail = router_1.createRouterPipeline({
    pathname: '/detail/:detailId',
    params: schema_1.object({
        detailId: schema_1.number,
    }),
    query: schema_1.object({
        tab: schema_1.nullable(schema_1.string),
    }),
});
detail.add(async (request) => {
    return responser_1.json({
        pathname: request.pathname,
        detailId: request.params.detailId,
        tab: request.query.tab,
    });
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
    responsers: [responser_1.JsonResponser, responser_1.TextResponser, responser_1.StatusResponser, responser_1.HTMLResponser],
    contexts: {
        history: HistoryCell.create([]),
    },
});
app.add(logger);
app.add(history);
app.add(home.middleware);
app.add(detail.middleware);
app.add(NotFound);
const server = app.listen(3002, () => {
    console.log('server start at port: 3002');
});
server;
