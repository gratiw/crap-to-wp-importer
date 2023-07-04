const parser = require('xml2json');
const axios = require('axios');
const FormData = require('form-data');
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

function uploadImagesToWordPress(imageUrls) {
  const base64Credentials = Buffer.from('admin:secret').toString('base64');
  const authHeader = `Basic ${base64Credentials}`;

  const imageArray = [];
  let imageIndex = 0;

  function uploadNextImage() {
    if (imageIndex >= imageUrls.length) {
      return Promise.resolve(imageArray);
    }

    const url = imageUrls[imageIndex];
    return uploadImage(url, authHeader)
      .then(response => {
        if (response.status === 201) {
          const imageId = response.data.id;
          imageArray.push({ id: imageId });
        }
        imageIndex++;
        return uploadNextImage();
      })
      .catch(error => {
        console.error('Error uploading image:', error);
        imageIndex++;
        return uploadNextImage();
      });
  }

  return uploadNextImage();
}

function uploadImage(url, authHeader) {
  const form = new FormData();

  return axios
    .get(url, { responseType: 'stream' })
    .then(response => {
      const imageStream = response.data;
      const filename = url.substring(url.lastIndexOf('/') + 1);

      form.append('file', imageStream, {
        filename: filename,
        contentType: response.headers['content-type'],
      });

      return axios.post('http://favor.local/wp-json/wp/v2/media', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': authHeader,
        },
      });
    });
}

fs.readFile('./file_to_import/import-full.xml', function(err, data) {
  if (err) {
    console.error(err);
    return;
  }

  const parsedXml = parser.toJson(data);
  const json = JSON.parse(parsedXml);
  const products = json.products.product;

  let productIndex = 0;

  function createNextProduct() {
    if (productIndex >= products.length) {
      return;
    }

    const element = products[productIndex];
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
        
        let categoryIndex = 0;
        
        function processNextCategory() {
          if (categoryIndex >= categories.length) {
            uploadImagesToWordPress(imageArray)
              .then(imageArray => {
                console.log('Uploaded image IDs:', imageArray);
        
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
                  weight: element.waga_produktu,
                  dimensions: {
                    length: element.dlugosc,
                    width: element.szerokosc,
                    height: element.wysokosc
                  },
                  categories: productCategories,
                  images: imageArray,
                  attributes: attributeArray
                };
        
                return api.post("products", productData);
              })
              .then(response => {
                console.log('Product created:', element.nazwa_produktu);
                productIndex++;
                createNextProduct();
              })
              .catch(error => {
                console.error('Error creating product:', error);
                productIndex++;
                createNextProduct();
              });
        
            return;
          }
        
          const categoryName = categories[categoryIndex];
        
          return api.get('products/categories', { per_page: 100, search: categoryName })
            .then(response => {
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
        
                return api.post('products/categories', newCategoryData)
                  .then(newCategoryResponse => {
                    if (newCategoryResponse.data && newCategoryResponse.data.id) {
                      const categoryId = newCategoryResponse.data.id;
                      existingCategoryIds.push(categoryId);
                      productCategories.push({ id: categoryId });
                      console.log(`Category "${categoryName}" created with ID: ${categoryId}`);
                    }
                  });
              }
            })
            .then(() => {
              categoryIndex++;
              processNextCategory();
            })
            .catch(error => {
              console.log('Error processing category:', error);
              categoryIndex++;
              processNextCategory();
            });
        }
        
        let imageArray = Object.values(element).filter(value => typeof value === 'string' && value.startsWith('https://'));
        
        processNextCategory();
    }

    createNextProduct();
});
