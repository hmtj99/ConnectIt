const express = require('express')

const app = express();

app.get('/', async (req,res) => {
    res.send('Welcome to ConnectIt');
})

app.listen(3000, () => {
    console.log("Server connected on port 3000");
})