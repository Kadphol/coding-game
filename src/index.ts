import { Hono } from 'hono'
import { pokDengHandler } from './pokdeng'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/healthz', (c) => {
  return c.text('OK')
})

app.post('/api/pokdeng', pokDengHandler)

export default app
