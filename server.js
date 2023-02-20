require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const utils = require('./utils');

const app = express();
const port = process.env.PORT || 4000;

// enable CORS
app.use(cors());
// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// request handlers
app.get('/', (req, res) => {
  if (!req.user)
    return res
      .status(401)
      .json({ success: false, message: 'Invalid user to access it.' });
  res.send('Welcome to the Node.js Tutorial! - ' + req.user.name);
});

// static customer details
let userData = {
  id: '1101',
  username: 'user',
  password: 'user',
  name: 'Bhanupriya',
  email: 'priya4893@gmail.com',
  phone: '+91 8870668105',
  address: 'Test data',
  limit: '5000',
  type: 'Retail',
};

let accountDetails = [
  {
    account_number: '0001234',
    account_type: 'Current',
    balance: '0.00',
  },
  {
    account_number: '0001122',
    account_type: 'Savings',
    balance: '5000.00',
  },
];

// validate the user credentials
app.post('/users/signin', function (req, res) {
  const user = req.body.username;
  const pwd = req.body.password;

  // return 400 status if username/password is not exist
  if (!user || !pwd) {
    return res.status(400).json({
      error: true,
      message: 'Username or Password required.',
    });
  }

  // return 401 status if the credential is not match.
  if (user !== userData.username || pwd !== userData.password) {
    return res.status(401).json({
      error: true,
      message: 'Username or Password is Wrong.',
    });
  }

  // generate token
  const token = utils.generateToken(userData);
  // get basic user details
  const userObj = utils.getCleanUser(userData);
  // return the token along with user details
  return res.json({ user: userObj, token });
});

// verify the token and return it if it's valid
app.get('/verifyToken', function (req, res) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token;
  if (!token) {
    return res.status(400).json({
      error: true,
      message: 'Token is required.',
    });
  }
  // check token that was passed by decoding token using secret
  jwt.verify(token, process.env.JWT_TOKEN, function (err, user) {
    if (err)
      return res.status(401).json({
        error: true,
        message: 'Invalid token.',
      });

    // return 401 status if the id does not match.
    if (userData.id !== user.id) {
      return res.status(401).json({
        error: true,
        message: 'Invalid user.',
      });
    }
    // get basic user details
    var userObj = utils.getCleanUser(userData);
    return res.json({ user: userObj, token });
  });
});

// return user data
app.get('/getUserDetails', function (req, res) {
  return res.json({ userData });
});

//update user data
app.post('/updateUser', function (req, res) {
  const values = req.body.values;
  userData = { ...userData, ...values };
  return res.json({ userData });
});

app.get('/getAccountDetails', function (req, res) {
  return res.json({ accountDetails });
});

app.post('/updateLimit', (req, res) => {
  const data = req.body.limit;
  userData.limit = data;

  return res.json({ userData });
});

const transactionList = require('./transactionList');

app.post('/getTransactionList', (req, res) => {
  const params = req.body.queryParams;
  const result = transactionList.slice(
    params.page * params.items - params.items,
    params.items * params.page
  );
  return res.json({
    transactionList: result,
    totalCount: transactionList.length,
  });
});

app.post('/updateBalance', (req, res) => {
  const params = req.body.values;
  let data = accountDetails.find((x) => x['account_type'] === 'Savings');
  if (params.type === 'withdraw') {
    const finalAmt = data.balance - params.withdrawVal;
    data['balance'] = finalAmt;
    transactionList.unshift({
      trans_id: transactionList.length + 1,
      trans_remarks: params.remarks,
      type: 'Dr',
      amount: params.withdrawVal,
      balance: finalAmt,
    });
  } else if (params.type === 'deposit') {
    const depositVal =
      params.depositType === 'cheque'
        ? Number(params.cheque_amt)
        : Number(params.depositValue);
    const finalAmt = Number(data.balance) + Number(depositVal);
    data['balance'] = finalAmt;
    transactionList.unshift({
      trans_id: transactionList.length + 1,
      trans_remarks: params.remarks,
      cheque_number:
        params.depositType === 'cheque' ? params.cheque_number : '',
      type: 'Cr',
      amount:
        params.depositType === 'cheque'
          ? params.cheque_amt
          : params.depositValue,
      balance: finalAmt,
    });
  }
  return res.json({ transactionList });
});

app.listen(port, () => {
  console.log('Node Server started on: ' + port);
});
