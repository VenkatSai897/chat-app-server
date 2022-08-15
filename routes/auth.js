const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

//REGISTER
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const unhashedPassword = req.body.password;
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      profilePicture:req.body.profilePicture,
      unhashedPassword:unhashedPassword
    });
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err)
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if(!user){
    res.status(200).json("user not found");
    }
    else{
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if(!validPassword){
    res.status(200).json("wrong password")
    }
    else{
    res.status(200).json(user)
    }
  }
  } catch (err) {
    res.send(err) 
  }
});

module.exports = router;
