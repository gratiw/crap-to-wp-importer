var WPAPI = require( 'wpapi' );
var parser = require('xml2json');

// You must authenticate to be able to POST (create) a post
var wp = new WPAPI({
    endpoint: 'http://favor.local/wp-json',
    // This assumes you are using basic auth, as described further below
    username: 'admin',
    password: 'secret'
});

fs = require('fs');

fs.readFile( './file_to_import/import.xml', function(err, data) {
    var json = parser.toJson(data);
    console.log("to json ->", json);
 });

// wp.posts().create({
//     // "title" and "content" are the only required properties
//     title: 'Your Post Title',
//     content: 'Your post content',
//     // Post will be created as a draft by default if a specific "status"
//     // is not specified
//     status: 'publish'
// }).then(function( response ) {
//     // "response" will hold all properties of your newly-created post,
//     // including the unique `id` the post was assigned on creation
//     console.log( response.id );
// });