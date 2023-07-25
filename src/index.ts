import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { HashManager } from './services/HashManager'
import { playlistRouter } from './router/playlistRouter'
import { userRouter } from './router/userRouter'


dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.listen(Number(process.env.PORT) || 3003, () =>{
    console.log(`Servidor rodando na porta ${Number(process.env.PORT) || 3003}`)
})

app.use("/users", userRouter)

app.use("/playlists", playlistRouter)

app.get("/ping", (req,res)=>{
    res.send("pong")
})

// criando um crypt para senha
// const hashManager = new HashManager()
// hashManager.hash("senha").then((res)=>{
//     console.log(res)
// })