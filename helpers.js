const { urlDatabase, users } = require('./data');

const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

const createUser = (users, email, password) => {
  const newUser = {
    id: generateRandomString(),
    email,
    password
  };

  users[newUser.id] = newUser;

  return newUser;
};

const findUserByEmail = function(users, email) {
  const usersList = Object.values(users);

  const user = usersList.find((user) => email === user.email);

  return user;
};

const validateUser = function(users, email, password) {
  const user = findUserByEmail(users, email);

  if (email === "" || password === "") {
    return { error : "Email or Password is blank!", user : undefined };
  }
  
  if (!user) {
    return { error : "User not found!", user : undefined };
  }
  
  if (user.password !== password) {
    return { error : "Password doesn't match!", user : undefined };
  }
  
  return { error : undefined, user };
};

const urlsForUser = function(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

module.exports = { generateRandomString, findUserByEmail, createUser, validateUser, urlsForUser };