const inquirer = require("inquirer");
const mysql = require("mysql");

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Ideal123',
    database: 'bamazon'
});

connection.connect(function(err) {
    if (err) throw err;
    start();
});

function start () {
    let products = [];
    
    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            
            if (err) throw err;

            console.log(`\nItems For Sale: \n`)
            for (let i in res) {
                products.push(new Array(res[i].item_id, res[i].product_name, res[i].price));
                console.log(`ID: [${products[i][0]}] Product: [${products[i][1]}] Price: [${products[i][2]}] \n`)
            };
            customerQuery1(products);
        }
    );   
};

function customerQuery1 (products) {

    inquirer.prompt([
        {
            type: 'input',
            message: 'Which product would you like to purchase? Enter the ID of the item you would like.',
            name: 'choice',
            validate: function (input) {
                if (input <= 0 || input > products.length || isNaN(input) === true) {
                    console.log('\n\nYou must enter a valid product ID.\n');
                    return;
                } else {
                    return true;
                }
            }
        }
    ]).then(function (response1) {
        customerQuery2(response1);
    });
};

function customerQuery2 (response1) {

    inquirer.prompt([
        {
            type: 'input',
            message: `How many of item ${response1.choice} would you like?`,
            name: 'choice',
            validate: function (input) {
                if (isNaN(input) || input <= 0) {
                    console.log('\n\nYou must enter a positive amount.\n');
                    return;
                } else {
                    return true;
                }
            }
        }
    ]).then(function (response2){
        connection.query(
            `SELECT stock_quantity, price, product_sales FROM products WHERE item_id =${response1.choice}`,
            function (err, res) {
                if (err) {
                    throw err;
                }  else if (response2.choice > res[0].stock_quantity) {
                    console.log("\nNot enough items in stock!");
                    setTimeout(function() {
                        start();
                    }, 1000);
                } else {
                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stock_quantity: res[0].stock_quantity - response2.choice
                            },
                            {
                                item_id: response1.choice
                            }
                        ],
                        function (err, res) {
                            if (err) throw err;
                        }
                    )
                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                product_sales: res[0].product_sales + (response2.choice * res[0].price)
                            },
                            {
                                item_id: response1.choice
                            }
                        ],
                        function (err, res) {
                            if (err) throw err;
                            finishTransaction();
                        }
                    )
                };
                function finishTransaction() {
                    var total = response2.choice * res[0].price;
                    console.log(`\nYour total is ${total}\n`);

                    inquirer.prompt([
                        {
                            type: "confirm",
                            message: "Would you like to pay?",
                            name: "choice"
                        }
                    ]).then(function (response) {
                        if (response.choice) {
                            inquirer.prompt([
                                {
                                    type: "confirm",
                                    message: "Thank you! Would you like to purchase anything else?",
                                    name: "choice"
                                }
                            ]).then(function (response) {
                                if (response.choice) {
                                    start();
                                } else {
                                    console.log("\nHave a nice day!");
                                    connection.end();
                                }
                            })
                        } else {
                            console.log("\nSince I already gave you the stuff, I guess you can have it. But you gotta go!");
                            setTimeout(function () {
                                connection.end();
                            }, 1000);
                        };
                    });                
                };
            }
        );
    });
};