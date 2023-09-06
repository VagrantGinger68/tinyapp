const express = require("express");
const app = express();
const PORT = 8080;

const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const { urlDatabase, users } = require('./data');

const { generateRandomString, findUserByEmail, createUser } = require('./helpers');

//---------GET REQUESTS--------------

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urlDatabase, user : users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL, longURL: urlDatabase[shortURL], user : users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]]};
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]]};
  res.render("login", templateVars);
});


//-------------POST REQUESTS-------------

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log(`Deleted ${shortURL} from urlDatabase`);
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.newURL;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userCheck = findUserByEmail(users, email);
  if (!userCheck) {
    res.status(403).send("User not found");
  } else if (userCheck.password !== password) {
    res.status(403).send("Password doesn't match");
  } else {
    res.cookie("user_id", userCheck.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  let { email, password } = req.body;
  let userCheck = findUserByEmail(users, email);

  if (email === "" || password === "") {
    res.status(400).send("Email or Password was left blank!");
  } else if (!userCheck) {
    const user = createUser(users, email, password);
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.status(400).send("User already exists!");
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});