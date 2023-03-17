const express = require('express');
const mongoose = require('mongoose');
const User = require("./User");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
const PORT = process.env.PORT_ONE || 7070;

mongoose.connect("mongodb://127.0.0.1:27017/auth-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if(!user) {
        return res.json({ message: "User doesn't exist" });
    } else {

        if (password !== user.password) {
            return res.json({
                message: "Password Incorrect"
            });
        }
        const payload = {
            email,
            name: user.name
        };
        jwt.sign(payload, "secret", (err, token) => {
            if (err) console.log(err);
            else {
                return res.json({ token: token});
            }
        })
    }
})

app.post("/auth/register", async (req, res) => {
    const { email, password, name} = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) {
        return res.json({ message: "User already exist" });
    } else {
        const newUser = new User({
            name,
            email,
            password
        });
        newUser.save();
        return res.json(newUser);
    }
});



app.listen(PORT, () => {
    console.log(`Auth-Service at ${PORT}`);
});