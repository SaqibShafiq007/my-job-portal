
import 'dotenv/config'
import { config } from './shared/config.js'
import { buildApp } from './app.js'

const app = buildApp()

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`)
})