import express from 'express'
import * as bodyParser from 'body-parser'
import {
  useContext,
  useHeaders,
  useReq,
  useRes,
  useRef,
  useRoute,
  useUrl,
  useMiddleware,
  useMatchBody,
  useMatchPath,
  useMatchHeaders,
  useMatchQuery,
  createExpressMiddleware,
  Ok,
  Err,
  Result,
  combine
} from './core'
import morgan from 'morgan'

type User = {
  id: string
  name: string
}

const userDb = [
  {
    id: 0,
    name: 'user0'
  },
  {
    id: 1,
    name: 'user1'
  }
]

const delay = (time = 0) => new Promise(resolve => setTimeout(resolve, time))

const useUser = () => {
  let res = useRes()
  let url = useUrl()

  useMiddleware(async next => {
    let start = Date.now()
    await next()
    console.log('time', Date.now() - start)
  })

  let userId = useMatchPath('/user/:id', (params: { id: string }): Result<number, string> => {
    let num = Number(params.id)

    if (Number.isNaN(num)) {
      return Err(`Expected user id to be a number, but received ${params.id}`)
    } else {
      return Ok(num)
    }
  })

  let fieldName = useMatchQuery<string>(query => {
    return Ok(query.field ?? 'name')
  })

  let userRequestGuard = combine([userId, fieldName], (userId, name) => {
    return {
      userId,
      name
    }
  })

  

  useRoute(userRequestGuard, async params => {
    let user = userDb.find(user => user.id === params.userId)

    await delay(1000)

    if (user) {
      res.json({
        status: {
          success: true,
          message: '',
          requestUrl: url.href
        },
        data: user
      })
    } else {
      res.json({
        status: {
          success: false,
          message: `user not found: ${params.userId}`,
          requestUrl: url.href
        },
        data: null
      })
    }
  })
}

const app = express()
const port = 3000

app.use(morgan('dev'))

// parse application/x-www-form-urlencoded
// tslint:disable-next-line: deprecation
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
// tslint:disable-next-line: deprecation
app.use(bodyParser.json())

app.use(
  createExpressMiddleware(() => {
    useUser()
  })
)

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
