const inquirer = require("inquirer");
const mysql = require("mysql");
const cTable = require('console.table');

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
            choices: ["View Product Sales By Department", "Create New Department"]
        }
    ]).then(function (response) {
        if (response.choice === "View Product Sales By Department") {
            viewProductsBySales();
        } else if (response.choice === "Create New Department") {
            createNewDepartment();
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
            console.log("\nHave a nice day!");
            connection.end();
        };
    });
};

function createNewDepartment () {
    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the department?",
            name: "name"
        },
        {
            type: "input",
            message: "What are the overhead costs of the department?",
            name: "overhead",
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
            "INSERT INTO departments SET ?",
            {
                department_name: response.name,
                over_head_cost: response.overhead
            },
            function (err, res) {
                if (err) throw err;
                console.log(`\n${response.name} has been added successfully.\n`)
                returnToMenu();
            }
        );
    });
};

function viewProductsBySales () {
    connection.query(
        "SELECT departments.department_id AS 'Department ID', departments.department_name AS 'Department Name', departments.over_head_cost AS 'Overhead Cost', SUM(products.product_sales) AS 'Product Sales', (Sum(products.product_sales) - departments.over_head_cost) AS 'Total Revenue' FROM departments INNER JOIN products ON products.department_name=departments.department_name GROUP BY departments.department_name ORDER BY departments.department_id",
        function (err, res) {
            if (err) throw err;
            console.table(res);
            returnToMenu();
        } 
    );
};