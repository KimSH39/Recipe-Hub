const express = require('express');
const passport = require('passport');
const router = express.Router();

const { isLoggedIn } = require('./middlewares');

router.get('/', (req, res) => {
  res.render('main'); // main.ejs 파일로 이동
});

router.get('/main', isLoggedIn, (req, res) => {
  res.render('main'); // main.ejs 파일로 이동
});

router.get('/kakao', passport.authenticate('kakao'));

router.get(
  '/kakao/callback',
  passport.authenticate('kakao', {
    failureRedirect: '/',
  }),
  (req, res) => {
    res.redirect('/');
  },
);

module.exports = router;
