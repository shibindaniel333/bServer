require("dotenv").config();
const express = require("express");
const cors = require("cors");
require('./database/connection')
const router = require("./routes/router");
const bServer = express();

bServer.use(cors());    
bServer.use(express.json());
bServer.use(express.urlencoded({ extended: true }));
bServer.use('/uploads', express.static('./uploads'));
bServer.use(router);

const PORT = process.env.PORT || 3000;

bServer.listen(PORT, () => {
    console.log(`my PFSERVER Server is running on http://localhost:${PORT} and waiting for client request`);
});

bServer.get('/',(req,res)=>{
    res.status(200).send('<h1 style="color:blue;">my BSERVER Server is running on PORT and waiting for client request!!!</h1>') 
 
 })

 bServer.post('/',(req,res)=>{
    res.status(200).send("POST REQUEST")
})