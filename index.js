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