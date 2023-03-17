const express = require('express');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const Order = require("./Order");
const isAuthenticated = require("../isAuthenticated");

const app = express();
app.use(express.json());
const PORT = process.env.PORT_ONE || 9090;

var channel, connection;

mongoose.connect("mongodb://127.0.0.1:27017/Order-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


async function connect() {
    const amqpServer = "amqp://127.0.0.1:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
}

function createOrder(products, userEmail) {
    let total = 0;
    for (let t=0; t<products.length; t++) {
        total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total
    });
    newOrder.save();
    return newOrder;
}

connect().then(() => {
    channel.consume("ORDER", data => {
        const { products, userEmail } = JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail);
        channel.ack(data);
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })));
        console.log("Consuming ORDER Queue");
        console.log(products);
    });
});


app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});