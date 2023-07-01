var parser = require('xml2json');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://favor.local",
  consumerKey: "ck_613cc14c7c22b7b0e001af56cca4b8102aeef4d8",
  consumerSecret: "cs_1740bace17e43a82e05463df2f73f40e4d0e1f56",
  version: "wc/v3"
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

        console.log(element.nazwa_produktu);
    });


 });