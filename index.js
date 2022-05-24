const express = require('express');
const cors = require('cors');

const login = require('./routers/login');
const registered = require('./routers/registered');
const find = require('./routers/find');
const cp = require('./routers/cp');

const app = express();
const port = 9000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/login', login);
app.use('/api/registered', registered);
app.use('/api/find', find);
app.use('/api/cp', cp);

app.listen(port, () => {
    console.log("server run at", port);
});
