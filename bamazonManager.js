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
    inquirer.prompt([
        {
            type: "rawlist",
            message: "What would you like to do?",
            name: "choice",
            choices: ["View Products For Sale", "View Low Inventory", "Add To Inventory", "Add New Product"]
        }
    ]).then(function (response) {
        if (response.choice === "View Products For Sale") {
            viewProducts();
        } else if (response.choice === "View Low Inventory") {
            viewLowInventory();
        } else if (response.choice === "Add To Inventory") {
            addToInventory();
        } else if (response.choice === "Add New Product") {
            addNewProduct();
        } else {
            console.log("error");
        };
    });
};

function returnToMenu () {
    inquirer.prompt([
        {
            type: "confirm",
            message: "Would you like to do anything else?",
            name: "choice"
        }
    ]).then(function (response) {
        if (response.choice) {
            start();
        } else {
            console.log("\n Have a nice day!");
            connection.end();
        };
    });
};

function viewProducts () {

    let products = [];

    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            
            if (err) throw err;

            console.log(`\nProducts For Sale: \n`)

            for (let i in res) {
                products.push(new Array(res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity));
                console.log(`ID: [${products[i][0]}] Product: [${products[i][1]}] Department: [${products[i][2]}] Price: [${products[i][3]}] Stock: [${products[i][4]}] \n`);
            };

            returnToMenu();
        }
    ); 
};

function viewLowInventory () {

    let products = [];

    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            
            if (err) throw err;

            console.log(`\nLow Inventory Products: \n`)

            for (let i in res) {
                if (res[i].stock_quantity < 5) {
                    products.push(new Array(res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity));
                };
            };

            if (products[0]) {
                for (let i in products) {
                    console.log(`ID: [${products[i][0]}] Product: [${products[i][1]}] Department: [${products[i][2]}] Price: [${products[i][3]}] Stock: [${products[i][4]}] \n`)
                }
            } else {
                console.log("All products are well stocked.\n")
            };

            returnToMenu();
        }
    ); 
};

function addToInventory () {

    let products = [];

    connection.query(
        "SELECT item_id, product_name, stock_quantity FROM products",
        function (err, res) {
            if (err) throw err;
            for (let i in res) {
                products.push(new Array(res[i].item_id, res[i].product_name, res[i].stock_quantity));
                console.log(`ID: [${products[i][0]}] Product: [${products[i][1]}] Stock: [${products[i][2]}] \n`)
            }
            updateStock(products);
        }
    );

    function updateStock(products) {

        inquirer.prompt([
            {
                type: "input",
                message: "Which product would you like to add to? Please enter the item ID.",
                name: "choice",
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

            connection.query(
                `SELECT product_name, stock_quantity FROM products WHERE item_id = ${response1.choice}`,
                function (err, res) {

                    if (err) throw err;

                    console.log(`\nThe current stock of ${res[0].product_name} is ${res[0].stock_quantity}\n`);
                    
                    inquirer.prompt([
                        {
                            type: "input",
                            message: "What quantity would you like to add?",
                            name: "choice",
                            validate: function (input) {
                                if (isNaN(input) || input <= 0) {
                                    console.log('\n\nYou must enter a positive amount.\n');
                                    return;
                                } else {
                                    return true;
                                }
                            }
                        }
                    ]).then(function (response2) {
                        
                        connection.query(
                            'UPDATE products SET ? WHERE ?',
                            [
                                {
                                    stock_quantity: parseInt(res[0].stock_quantity) + parseInt(response2.choice)
                                },
                                {
                                    item_id: response1.choice
                                }
                            ],
                            function (err, res) {
                                if (err) throw err;
                                console.log("\nThe product stock was successfully updated.\n")
                                connection.query(
                                    `SELECT product_name, stock_quantity FROM products WHERE item_id = ${response1.choice}`,
                                    function (err, res) {
                                        if (err) throw err;
                                        console.log(`The stock of ${res[0].product_name} is now ${res[0].stock_quantity}\n`)
                                        returnToMenu();
                                    }
                                )
                            }
                        );
                    });
                }
            );
        });
    };
};

function addNewProduct () {

    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the product you would like to add?",
            name: "name"
        },
        {
            type: "input",
            message: "What department does the product belong to?",
            name: "department"
        },
        {
            type: "input",
            message: "What is the price of the product?",
            name: "price",
            validate: function (input) {
                if (isNaN(input) || input <= 0) {
                    console.log('\n\nYou must enter a positive amount.\n');
                    return;
                } else {
                    return true;
                }
            }
        },
        {
            type: "input",
            message: "What quantity are we adding",
            name: "quantity",
            validate: function (input) {
                if (isNaN(input) || input <= 0) {
                    console.log('\n\nYou must enter a positive amount.\n');
                    return;
                } else {
                    return true;
                }
            }
        }
    ]).then(function (response) {

        connection.query(
            "INSERT INTO products SET ?",
            {
                product_name: response.name,
                department_name: response.department,
                price: response.price,
                stock_quantity: response.quantity
            },
            function (err, res) {
                if (err) throw err;
                console.log(`\n${response.name} has been added successfully.\n`)
                returnToMenu();
            }
        );
    });
};