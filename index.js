const express = require("express");
const app = express();
const mysql = require('mysql');
 
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'secret',
    database: 'favor'
});
 
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Server!');
});
 
app.listen(3000, () => {
    console.log('Server is running at port 3000');
});

connection.query('SELECT * from wp_posts WHERE post_type="product"', (err, rows) => {
    if (err) throw err;
    console.log('The data from users table are: \n', rows);
    connection.end();
});
 