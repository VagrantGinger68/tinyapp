const { urlDatabase } = require('./data');

//Generate a random 6 digit string
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

//Create new user
const createUser = (users, email, password) => {
  const newUser = {
    id: generateRandomString(),
    email,
    password
  };

  users[newUser.id] = newUser;

  return newUser;
};

//Function to find a specific user based on their email
const findUserByEmail = function(database, email) {
  const usersList = Object.values(database);

  const user = usersList.find((user) => email === user.email);

  return user;
};

//Function to pick out all the URLS for a specific user
const urlsForUser = function(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

module.exports = { generateRandomString, findUserByEmail, createUser, urlsForUser };

// user.password === password