var parser = require('xml2json');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://favor.local",
  consumerKey: "ck_f930c7a360e2a74846c9decaf163ef35469a97aa",
  consumerSecret: "cs_7a867b2ea95cd1521c0b434cbbf763142ff30f12",
  version: "wc/v3"
});

function hasOnlyDigitsAndCommas(value) {
  const pattern = /^[0-9,]+$/;
  return pattern.test(value);
}

function hasLettersAndCommas(value) {
  const pattern = /[a-zA-Z,]/;
  return pattern.test(value);
}

fs = require('fs');

fs.readFile( './file_to_import/import.xml', function(err, data) {
  
  var parsedXml = parser.toJson(data);
  var json = JSON.parse(parsedXml);
  var product = json.products.product;
  var counter = 0;
  var productId;
  
  product.forEach(element => {
    counter++;

    var attributesArray = element.attributes.attribute;
    var convertedAttributes = [];
    var attributeArray = [];
    var attributeObject = {};
    var attributesIter = 0;
    
    attributesArray.forEach(item => {
      
      let value = item.attribute_value;

      if(item.attribute_name == 'SKU'){ return; }
      if(item.attribute_name == 'Produkt długość (cm)'){ return; }
      if(item.attribute_name == 'Produkt szerokość (cm)'){ return; }
      if(item.attribute_name == 'Produkt wysokość (cm)'){ return; }
      
      if(value == 'Nie dotyczy'){ return; }
      
      if(!isNaN(value) && hasOnlyDigitsAndCommas(value)) {
        value = Array(value.replace(',', '.'));
      }else if(!isNaN(value) && hasLettersAndCommas(value)){
        value = value.split(", ");
      }else{
        value = [value];
      }

      convertedAttributes[item.attribute_name] = value;

      attributeObject = {
        name: item.attribute_name,
        position: attributesIter,
        visible: true,
        variation: true,
        options: value,
      };

      attributeArray.push(attributeObject);
      attributesIter++;
    });

    // console.log(attributeArray);
    
    // Create a product
    api.post("products", {
    
      name: element.nazwa_produktu, // See more in https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
      type: "simple",
      regular_price: element.cena_detaliczna_brutto_pln,
      sku: element.sku,
      description: element.opis_dlugi_korzysci_html,
      short_description: element.opis_krotki_html,
      stock_quantity: element.ilosc,
      weight: '',
      dimensions: { length: element.dlugosc, width: element.szerokosc, height: element.wysokosc },
      categories: [ { id: 15, name: 'Uncategorized', slug: 'uncategorized' } ],
      images: [],
      attributes: attributeArray,
      // meta_data: [
      //   {
      //     key: 'ean',
      //     value: element.ean, // Replace with the actual EAN number
      //   },
      // ]
    }).then((response) => {
  
      // Successful request
      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);
      console.log("Response Data:", response.data);
      productId = response.data.id;
    }).catch((error) => {
  
      // Invalid request, for 4xx and 5xx statuses
      console.log("Response Status:", error.response.status);
      console.log("Response Headers:", error.response.headers);
      console.log("Response Data:", error.response.data);
    }).finally(() => {
  
      // Always executed.
    });

    // async function uploadImagesToMediaLibrary(imageUrls) {
    //   const uploadedImages = [];
    
    //   for (const imageUrl of imageUrls) {
    //     try {
    //       const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    //       const imageData = Buffer.from(response.data, 'binary');
    
    //       const mediaResponse = await api.post('media', {
    //         media: imageData.toString('base64'),
    //         mime_type: 'image/jpeg', // Modify mime_type according to your image type
    //         media_type: 'image'
    //       });
    
    //       uploadedImages.push(mediaResponse.data);
    
    //       // Add the uploaded image ID to the product's images array
    //       productData.images.push({
    //         src: mediaResponse.data.source_url,
    //         position: uploadedImages.length
    //       });
    //     } catch (error) {
    //       console.log(`Error uploading image from URL: ${imageUrl}`, error);
    //     }
    //   }
    
    //   return uploadedImages;
    // }
    
    // const imageUrls = [];
    
    // uploadImagesToMediaLibrary(imageUrls)
    //   .then((uploadedImages) => {
    //     console.log('Uploaded images:', uploadedImages);
    
    //     // Create the product with the uploaded images
    //     api.post('products', productData)
    //       .then((response) => {
    //         console.log('Created product:', response.data);
    //       })
    //       .catch((error) => {
    //         console.log('Error creating product:', error.response.data);
    //       });
    //   })
    //   .catch((error) => {
    //     console.log('Error uploading images:', error);
    //   });

    // console.log(element);
  });
});