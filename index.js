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
    var parsedXml = parser.toJson(data);
    var json = JSON.parse(parsedXml);
    var product = json.products.product;
    var counter = 0;

    product.forEach(element => {
        counter++;
        
        const newProduct = {
          title: product.title,
          content: product.description,
          type: 'product',
          status: 'publish',
          meta: {
            sku: product.sku,
            weight: product.weight,
            price: product.price,
            // Add more custom meta attributes here as needed
            // PRZERZUCIĆ SIĘ NA WC API!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          }
        };

        wp.posts().create(newProduct)
        .then((response) => {
          console.log(`Product created with ID: ${response.id}`);
        })
        .catch((error) => {
          console.error('Error creating product:', error);
        }); 

        console.log(element.nazwa_produktu);
    });


 });