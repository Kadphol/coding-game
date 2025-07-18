import { Hono } from 'hono'
import { pokDengHandler } from './pokdeng'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*', // You might want to restrict this in production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 3600,
    credentials: true,
  })
)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/healthz', (c) => {
  return c.text('OK')
})

app.post('/api/pokdeng', pokDengHandler)

app.onError((err, c) => {
  console.error(`[Error] ${err.message}`)
  console.error(err.stack)

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return c.json(
      {
        error: {
          message: 'Internal Server Error',
          id: crypto.randomUUID(), // For error tracking
        },
      },
      500
    )
  }

  return c.json(
    {
      error: {
        message: err.message,
        stack: err.stack,
      },
    },
    500
  )
})

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      status: 404,
      message: 'Not Found',
    },
    404
  )
})

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
}
