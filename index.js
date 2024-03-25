import dotenv from "dotenv"
dotenv.config( {path : "./.env"})
import { connectDB } from "./src/db/database.js"
import app from "./app.js"

const port = process.env.PORT 

connectDB()
.then(() => {
    try {
        app.listen( port || 8000 , () => {
            console.log(`server is started and running at ${port}`)
        })
    } catch (error) {
        console.log(`app.listen() failed to connectt to the server:${error}`)
    }
})
