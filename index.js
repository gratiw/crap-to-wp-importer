var parser = require('xml2json');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://favor.local",
  consumerKey: "ck_f930c7a360e2a74846c9decaf163ef35469a97aa",
  consumerSecret: "cs_7a867b2ea95cd1521c0b434cbbf763142ff30f12",
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

    const attributesArray = element.attributes.attribute;
    const convertedAttributes = {};
    
    attributesArray.forEach(item => {
      let value = item.attribute_value;
      if (!isNaN(value) && value.includes(',')) {
        value = parseFloat(value.replace(',', '.'));
      }
      convertedAttributes[item.attribute_name] = value;
    });
    
    //Create a product
    api.post("products", {
    
      name: element.nazwa_produktu, // See more in https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
      type: "simple",
      regular_price: element.cena_detaliczna_brutto_pln,
      sku: element.sku,
      description: element.opis_dlugi_korzysci_html,
      stock_quantity: element.ilosc,
      weight: '',
      dimensions: { length: element.dlugosc, width: element.szerokość, height: element.wysokosc },
      categories: [ { id: 15, name: 'Uncategorized', slug: 'uncategorized' } ],
      images: [],
      attributes: [ { color: 'czarny', producent: element.nazwa_producenta } ],
      meta_data: [],
    }).then((response) => {
  
      // Successful request
      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);
      console.log("Response Data:", response.data);
    }).catch((error) => {
  
      // Invalid request, for 4xx and 5xx statuses
      console.log("Response Status:", error.response.status);
      console.log("Response Headers:", error.response.headers);
      console.log("Response Data:", error.response.data);
    }).finally(() => {
  
      // Always executed.
    });

    console.log(element);
  });
});