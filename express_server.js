const express = require("express");
const app = express();
const PORT = 8080;

const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['secret-string', 'secret-string2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const { urlDatabase, users } = require('./data');

const { generateRandomString, findUserByEmail, createUser, urlsForUser } = require('./helpers');

//---------GET REQUESTS--------------

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const userUrls = urlsForUser(req.session.user_id);
    const templateVars = { user: users[req.session.user_id], urls: userUrls };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user : users[req.session.user_id] };
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    res.redirect("/login");
  } else if (userId !== urlDatabase[shortURL].userID) {
    res.status(403).send("<h1>You do not own this URL.</h1>");
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
  const templateVars = { user : users[req.session.user_id]};
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user : users[req.session.user_id]};
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});


//-------------POST REQUESTS-------------

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).res.send("<h1>You cannot post until you are logged in</h1>");
  }
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL : req.body.longURL, userID : req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let user = req.session.user_id;
  if (urlDatabase[req.params.shortURL].userID === user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("<h1>Deleting is not permitted because you are not logged in or you don't own this URL</h1>");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id;

  if (urlDatabase[req.params.shortURL].userID === user) {
    let newURL = req.body.newURL;
    urlDatabase[req.params.shortURL].longURL = newURL;
    res.redirect('/urls');
  } else {
    res.status(403).send("<h1>Editing is not permitted because you are not logged in or you don't own this URL</h1>");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(users, email);
  if (email === "" || password === "") {
    res.status(400).send("<h1>Email or Password was left blank!</h1>");
  }
  if (!user) {
    res.status(403).send("<h1>User not found!</h1>");
  }
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("<h1>Password isn't correct</h1>");
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(users, email);
  if (email === "" || password === "") {
    res.status(400).send("<h1>Email or Password was left blank!</h1>");
  } else if (!user) {
    let hashedPass = bcrypt.hashSync(password, 10);
    const user = createUser(users, email, hashedPass);
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(400).send("<h1>Email already in use!</h1>");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});