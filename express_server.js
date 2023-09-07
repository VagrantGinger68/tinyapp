//Express server setup
const express = require("express");
const app = express();
const PORT = 8080;

//Require cookie-session and bcrypt
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

//Cookie-session setup
app.use(cookieSession({
  name: 'session',
  keys: ['secret-string', 'secret-string2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//Import Databases from data.js
const { urlDatabase, users } = require('./data');

//Import helper functions
const { generateRandomString, findUserByEmail, createUser, urlsForUser } = require('./helpers');

//---------GET REQUESTS--------------

app.get("/", (req, res) => {
  //If user is not logged in, send to the login template
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  //If user is logged in, send to the urls template
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  //If user is not logged in, send to the login template
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    //Find the urls for the logged in user and render the url_index template
    const userUrls = urlsForUser(req.session.user_id);
    const templateVars = { user: users[req.session.user_id], urls: userUrls };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user : users[req.session.user_id] };
  //If user is not logged in, send to the login template
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  //If user is logged in, render the urls_new template
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  //If user is not logged in, send to the login page
  if (!userId) {
    res.redirect("/login");
  } else if (userId !== urlDatabase[shortURL].userID) {
    //If the userId is not the same as the one tied to the url, send an error
    res.status(403).send("<h1>You do not own this URL.</h1>");
  } else {
    //If user is logged in and owns the url, render the urls_show template
    const templateVars = { shortURL, longURL : urlDatabase[shortURL].longURL, user: users[userId] };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  //If urlDatabase does not contain the request url, send an error messsage
  if (!urlDatabase[req.params.shortURL]) {
    res.send("<h1>shortURL does not exist in urlDatabase or http:// is not in URL</h1>");
  } else {
    //Send the user to the website contained in the shortened url
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user : users[req.session.user_id]};
  //If user_id cookie exists, send the user to the urls template
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    //if the user_id cookie doesn't exist, send the user to the registration page
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user : users[req.session.user_id]};
  //If user_id cookie exists, send the user to the urls template
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    //if user_id cookie doesn't exist, send the user to the login template
    res.render("login", templateVars);
  }
});


//-------------POST REQUESTS-------------

app.post("/urls", (req, res) => {
  //If no user_id cookie exists, send an error message
  if (!req.session.user_id) {
    res.status(403).res.send("<h1>You cannot post until you are logged in</h1>");
  }
  //If the user is logged in, send them to the newly created shortURL
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL : req.body.longURL, userID : req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let user = req.session.user_id;
  //Only let items be deleted if user is logged in and owns the url
  if (urlDatabase[req.params.shortURL].userID === user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("<h1>Deleting is not permitted because you are not logged in or you don't own this URL</h1>");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id;
  //Only let items be edited if user is logged in and owns the url
  if (urlDatabase[req.params.shortURL].userID === user) {
    let newURL = req.body.newURL;
    urlDatabase[req.params.shortURL].longURL = newURL;
    res.redirect('/urls');
  } else {
    res.status(403).send("<h1>Editing is not permitted because you are not logged in or you don't own this URL</h1>");
  }
});

app.post("/login", (req, res) => {
  //Get the email and password from the forms
  const { email, password } = req.body;
  const user = findUserByEmail(users, email);
  if (email === "" || password === "") {
    res.status(400).send("<h1>Email or Password was left blank!</h1>");
  }
  if (!user) {
    res.status(403).send("<h1>User not found!</h1>");
  }
  //If hashed passwords don't match, send an error message
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("<h1>Password isn't correct</h1>");
  }
  //Set user_id cookie and send the user to the urls template
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  //Delete the session cookies and send the user to the login template
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(users, email);
  if (email === "" || password === "") {
    res.status(400).send("<h1>Email or Password was left blank!</h1>");
  } else if (!user) {
    //If user doesn't exist in database, create a new user with a hashed password
    let hashedPass = bcrypt.hashSync(password, 10);
    const user = createUser(users, email, hashedPass);
    //Set user_id cookie and send the user to the urls template
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    //Send a error message if email exists in database
    res.status(400).send("<h1>Email already in use!</h1>");
  }
});

//Express server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});