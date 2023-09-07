const express = require("express");
const app = express();
const PORT = 8080;

const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const { urlDatabase, users } = require('./data');

const { generateRandomString, findUserByEmail, createUser, validateUser, urlsForUser } = require('./helpers');

//---------GET REQUESTS--------------

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    const userUrls = urlsForUser(req.cookies["user_id"]);
    const templateVars = { user: users[req.cookies["user_id"]], urls: userUrls };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] };
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  if (!userId) {
    res.redirect("/login");
  } else if (userId !== urlDatabase[shortURL].userID) {
    res.status(403).send("You do not own this URL.");
  } else {
    const templateVars = { shortURL, longURL : urlDatabase[shortURL].longURL, user: users[userId] };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send("<h1>shortURL does not exist in urlDatabase or http:// is not in URL</h1>");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]]};
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]]};
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});


//-------------POST REQUESTS-------------

app.post("/urls", (req, res) => {
  if (res.cookie["user_id"]) {
    res.send("<h1>You cannot post until you are logged in</h1>");
    return;
  }
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL : req.body.longURL, userID : req.cookies["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let user = req.cookies["user_id"];
  if (urlDatabase[req.params.shortURL].userID === user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Deleting is not permitted");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  let user = req.cookies["user_id"];

  if (urlDatabase[req.params.shortURL].userID === user) {
    let newURL = req.body.newURL;
    urlDatabase[req.params.shortURL].longURL = newURL;
    res.redirect('/urls');
  } else {
    res.status(403).send("Editing is not permitted");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const { error,user } = validateUser(users, email, password);
  if (error) {
    res.status(403).send(error);
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const userCheck = findUserByEmail(users, email);

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