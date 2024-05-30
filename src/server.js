// CORE MODULES
const express = require("express");
const cors = require("cors");
const {json,urlencoded} = require("body-parser")
require("dotenv").config();


// Third Party Modules


// Custom Modules



// Create the APP
const app = express();

// Use the APP
app.use(cors({origin:"*"}));
app.use(urlencoded({ extended: true }));
app.use(json());



// APP ROUTES




// create a Port
const port = process.env.PORT || 4000;
// Start the Server
const start = () => {
app.listen(port,()=>{
console.log(`server runs at port ${port} `)
})
}

module.exports =  start

