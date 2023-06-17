// 랜덤 레시피 제공 + 가지고 있는 재료로 만들 수 있는 레시피 제공
// 60201868 김소현

const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const authRouter = require('./routes/auth');
const passportConfig = require('./passport');
const { sequelize } = require('./models');
const routes = require('./routes/routes.js');

const app = express();

sequelize
  .sync({ force: false })
  .then(() => {
    console.log('데이터 베이스 연결 성공');
  })
  .catch((err) => {
    console.log(err);
  });

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use('/public', express.static('public'));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passportConfig(passport);

app.use('/auth', authRouter); // 위치 중요
app.use(routes);
app.use('/', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// 오류 처리: 요청 경로가 없을 경우
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 서버 오류 처리
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
