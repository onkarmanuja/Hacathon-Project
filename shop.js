// Please Enter a valid Item that can be shopped 
// user will get a sorted table on the  basis of price (low-high) with the site name from where product can be purchased.
//user will get the links of different sites at different prices..
//enter input in format
//for eg . node shop.js Reebok shoes 
let puppeteer = require("puppeteer");
let inputArr = process.argv.slice(2);
let variable = " ";
for(let i = 0; i<inputArr.length;i++){
  variable += inputArr[i] + " ";
}

let fs = require("fs");
let itemToBuy = [];
let ValidLinks = [];

const { default: jsPDF } = require("jspdf");

console.log("Wait until data is extracting");
let browserStartPromise = puppeteer.launch({

  headless: true,

  defaultViewport: null,
  args: ["--start-maximized", "--disable-notifications"]
});
//opening a browser and go to google shopping
let page, browser;
(async function fn() {
  let browserObj = await browserStartPromise;

  browser = browserObj;
  page = await browserObj.newPage();
  await page.goto("https://shopping.google.com/")
  await page.waitForSelector(".r7gAOb.yyJm8b");

  //enter the item user want to buy

  await page.type(".r7gAOb.yyJm8b", variable);
  await page.keyboard.press('Enter', { delay: 100 });

  //Storing items details in an array..................
  //1. storing item name in an  array

  await page.waitForSelector(".EI11Pd");
  let itemLIST = await page.$$(".EI11Pd")

  let value = [];
  for (let i = 0; i < itemLIST.length; i++) {
    value[i] = await page.evaluate(
      function (element) { return element.textContent }, itemLIST[i]);

  }

  //  2. Store item price in an array. 

  await page.waitForSelector(".a8Pemb.OFFNJ");
  let itemPrice = await page.$$(".a8Pemb.OFFNJ")

  let val = [];
  for (let i = 0; i < itemPrice.length; i++) {
    val[i] = await page.evaluate(
      function (element) { return element.textContent }, itemPrice[i]);

  }
  // 3. Stroe site name in array from where product at given price can be purchased.


  await page.waitForSelector(".aULzUe.IuHnof");
  let itemLink = await page.$$(".aULzUe.IuHnof")

  let values = [];
  for (let i = 0; i < itemLink.length; i++) {
    values[i] = await page.evaluate(
      function (element) { return element.textContent }, itemLink[i]);
  }
  // 4. Store item Buuying link in array

  const href = await page.$$eval(".eaGTj.mQaFGe.shntl", el => el.map(x => x.getAttribute("href")));
   ValidLinks = [];
  for (let i = 0; i < href.length; i++) {
    ValidLinks[i] = ("https://www.google.com/" + href[i]);
  }
  // forming array of object of item including name,link,site name,price
  for (let i = 0; i < itemLIST.length; i++) {
    itemToBuy.push({ "productName": value[i], "productPrice": val[i], "productSite": values[i], "productLink": ValidLinks[i] })
  }
  sortPrice(itemToBuy);
})()

// function for waitandClick
function WaitandClick(selector, cPage) {
  (async function fn() {
    try {
      await cPage.waitForSelector(selector, { visible: true });
      await cPage.click(selector);
    } catch (error) {
      console.log("Error" + error);
    }
  })();
}

                          // Sorting of Item array on the basis of price (low to high) 
function sortPrice(itemToBuy) {
  let newArr = itemToBuy.map(singleFn);
  function singleFn(obj) {
    let productName = obj.productName;
    let productPrice = obj.productPrice;
    let productSite = obj.productSite;
    let productLink = obj.productLink;
    let priceWOSymbol = obj.productPrice.split("₹");
    let priceWOelement = priceWOSymbol[1].split("+ tax");
    let priceWOComma = priceWOelement[0].split(",");
    let priceInRupee;

    if (priceWOComma.length == 1) {
      priceInRupee = Number(priceWOComma[0]);
    }
    else if (priceWOComma.length == 2) {
      priceInRupee = Number(priceWOComma[0]) * 1000 + Number(priceWOComma[1]);
    }
    else {
      priceInRupee = Number(priceWOComma[0]) * 100000 + Number(priceWOComma[1]*100 +  Number(priceWOComma[2]));
    }
    return {
      productName: productName,
      productPrice: productPrice,
      productSite: productSite,
      priceInRupee: priceInRupee,
      productLink: productLink,
    }
  }
  let sortedArr = newArr.sort(cb);
  function cb(objA, objB) {
    return objA.priceInRupee - objB.priceInRupee;
  }
  let finalArr = sortedArr.map(removePriceinRupee);
  function removePriceinRupee(obj) {
    return {
      productName: obj.productName,
      productPrice: obj.productPrice,
      productSite: obj.productSite,
     
    }
  } 
   //table of item prices from diff site.....
   console.table(finalArr);
   pdfGenerator(ValidLinks,finalArr,variable);
}
                                    // pdf generator for links of different sites
function pdfGenerator(Array,finalArr ,variable) {
       
          if(fs.existsSync(variable + ".pdf"))
              fs.unlinkSync(variable +".pdf");
          const doc = new jsPDF();
          for(let i=0; i<Array.length; i++) {
              doc.setFontSize(10);
              doc.text(finalArr[i].productName + " Link --> " , 10, 10 + 15 * i);
              doc.setFontSize(7);
              doc.text(Array[i] , 10 , 15 + 15 * i);
          }
          doc.save(variable+ ".pdf");
      }