const express = require('express');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const Product = require("./Product");
const isAuthenticated = require("../isAuthenticated");

var order; 

const app = express();
app.use(express.json());
const PORT = process.env.PORT_ONE || 8080;

var channel, connection;

mongoose.connect("mongodb://127.0.0.1:27017/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


async function connect() {
    const amqpServer = "amqp://127.0.0.1:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}

connect();

// Create a new Product
app.post("/product/create", isAuthenticated, async (req, res) => {
    //req.user.email

    const { name, description, price } = req.body;
    const newProduct = new Product({
        name,
        description,
        price,
    });
    newProduct.save()
    return res.json(newProduct);
});

// User sends a list of product's IDs to buy
// Creating an order with those products and total value of sum of product's prces
app.post("/product/buy", isAuthenticated, async(req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids }});
    channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
        products,
        userEmail: req.user.email,
    })));
    channel.consume("PRODUCT", data => {
        console.log("Consuming PRODUCT queue");
        order = JSON.parse(data.content);
        console.log("Order: ",order);
        channel.ack(data);
    });
    console.log("Order2: ",order);
    return res.json(order);
});

app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});