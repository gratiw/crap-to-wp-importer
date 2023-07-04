const parser = require('xml2json');
const axios = require('axios');
const fs = require('fs');
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

fs.readFile('./file_to_import/import.xml', async function(err, data) {
  if (err) {
    console.error(err);
    return;
  }

  const parsedXml = parser.toJson(data);
  const json = JSON.parse(parsedXml);
  const products = json.products.product;

  for (const element of products) {
    const attributesArray = element.attributes.attribute;
    const attributeArray = [];
    let attributesIter = 0;

    const productTags = [];

    attributesArray.forEach(item => {
      const value = item.attribute_value;

      if (
        item.attribute_name === 'SKU' ||
        item.attribute_name === 'Produkt długość (cm)' ||
        item.attribute_name === 'Produkt szerokość (cm)' ||
        item.attribute_name === 'Produkt wysokość (cm)'
      ){
        return;
      } else if(item.attribute_name === 'Materiał' || item.attribute_name === 'Styl' || item.attribute_name === 'Przeznaczenie'){
        let tags = value.split(", ");
        const tagObjects = tags.map(tag => ({ name: tag }));
        productTags.push(...tagObjects);
      }

      if (value === 'Nie dotyczy') {
        return;
      }

      let options;

      if (!isNaN(value) && hasOnlyDigitsAndCommas(value)) {
        options = Array(value.replace(',', '.'));
      } else if (!isNaN(value) && hasLettersAndCommas(value)) {
        options = value.split(", ");
      } else {
        options = [value];
      }

      const attributeObject = {
        name: item.attribute_name,
        position: attributesIter,
        visible: true,
        variation: true,
        options: options,
      };

      attributeArray.push(attributeObject);
      attributesIter++;
    });

    const categoryList = element.nazwa_kategorii;
    const categories = categoryList.split(',').map(category => category.trim());

    const existingCategoryIds = [];
    const productCategories = [];

    for (const categoryName of categories) {
      try {
        const response = await api.get('products/categories', { per_page: 100, search: categoryName });

        if (response.data.length > 0) {
          const categoryId = response.data[0].id;
          existingCategoryIds.push(categoryId);
          productCategories.push({ id: categoryId });
          console.log(`Category "${categoryName}" already exists with ID: ${categoryId}`);
        } else {
          const newCategoryData = {
            name: categoryName,
            description: 'Category description',
            // Additional category properties can be added here
          };

          const newCategoryResponse = await api.post('products/categories', newCategoryData);

          if (newCategoryResponse.data && newCategoryResponse.data.id) {
            const categoryId = newCategoryResponse.data.id;
            existingCategoryIds.push(categoryId);
            productCategories.push({ id: categoryId });
            console.log(`Category "${categoryName}" created with ID: ${categoryId}`);
          }
        }
      } catch (error) {
        console.log('Error:', error);
      }
    }
    
    const imageArray = Object.values(element).filter(value => typeof value === 'string' && value.startsWith('https://'));
  
    // console.log(imageArray);
    
    try {

      const productData = {
        name: element.nazwa_produktu,
        type: "simple",
        regular_price: element.cena_detaliczna_brutto_pln,
        sku: element.sku,
        description: element.opis_dlugi_korzysci_html,
        short_description: element.opis_krotki_html,
        manage_stock: true,
        stock_quantity: element.ilosc,
        tags: productTags,
        weight: '',
        dimensions: {
          length: element.dlugosc,
          width: element.szerokosc,
          height: element.wysokosc
        },
        categories: productCategories,
        images : [],
        attributes: attributeArray
      };

      const response = await api.post("products", productData);

      if (response.data && response.data.id) {
        console.log('Product created: ' + element.nazwa_produktu);
        // console.log("Response Status:", response.status);
        // console.log("Response Headers:", response.headers);
        // console.log("Response Data:", response.data);
      }
    } catch (error) {
      console.log("Error:", error.response.data);
    }
  }
});