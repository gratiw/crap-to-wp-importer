const express = require("express");
const app = express();
const mysql = require('mysql');
var WPAPI = require( 'wpapi' );
 
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

function sqlQuery(queryString){
    connection.query(queryString, (err, rows) => {
        if (err) throw err;
        console.log('The data from users table are: \n', rows);
        connection.end();
    });
}

// You must authenticate to be able to POST (create) a post
var wp = new WPAPI({
    endpoint: 'http://favor.local/wp-json',
    // This assumes you are using basic auth, as described further below
    username: 'admin',
    password: 'secret'
});

var uriString = wp.posts().id( 1 ).embed().toString();

wp.posts().create({
    // "title" and "content" are the only required properties
    title: 'Your Post Title',
    content: 'Your post content',
    // Post will be created as a draft by default if a specific "status"
    // is not specified
    status: 'publish'
}).then(function( response ) {
    // "response" will hold all properties of your newly-created post,
    // including the unique `id` the post was assigned on creation
    console.log( response.id );
})