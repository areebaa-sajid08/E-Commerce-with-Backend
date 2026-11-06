import http from "node:http"
import env from "./src/config/env.js"
import app from "./src/app.js"
import connectDB from "./src/db/db.js"
import { initRealtime } from "./src/realtime.js"

await connectDB()

const server = http.createServer(app)
initRealtime(server)

server.listen(env.port, () => {
    console.log(`API + sockets running on http://localhost:${env.port}`)
})
