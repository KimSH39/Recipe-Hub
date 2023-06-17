const express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const { User } = require('../models');
const { Post } = require('../models');

// 파일 업로드를 처리할 multer 설정
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // 업로드된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
      );
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일 사이즈 제한 (10MB)
});

// GET 요청에 대한 메인 페이지 렌더링
router.get('/', isLoggedIn, (req, res) => {
  res.render('main'); // main.ejs 파일로 이동
});

router.get('/main', isLoggedIn, (req, res) => {
  res.render('main'); // main.ejs 파일로 이동
});

// GET 요청에 대한 로그인 페이지 렌더링
router.get('/login', isNotLoggedIn, (req, res) => {
  res.render('login');
});

// local login
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    console.info('___passport.authenticate()');
    if (authError) {
      console.error(authError);
      return res.redirect('/login');
    }
    if (!user) {
      return res.redirect('/login');
    }

    console.info('___req.login()');
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return res.redirect('/login');
      }
      return res.redirect('/');
    });
  })(req, res, next);
});

router.get('/signup', isNotLoggedIn, (req, res) => {
  res.render('signup');
});

// local 회원가입
router.post('/signup', isNotLoggedIn, async (req, res, next) => {
  const { email, username, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect('/signup?error=exist');
    }
    console.info('___User.create(): ' + username);
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      username,
      password: hash,
    });
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// POST 요청에 대한 ingredients 처리
router.post('/ingredients', isLoggedIn, async (req, res) => {
  try {
    const { ingredient } = req.body; // 검색어 값 가져오기

    const response = await axios.get(
      'https://api.spoonacular.com/recipes/findByIngredients',
      {
        params: {
          ingredients: ingredient, // 검색어 값을 params에 설정
          apiKey: 'mykey',
          number: 5,
        },
      },
    );

    const recipes = response.data;

    if (recipes === null || recipes.length === 0) {
      res.render('noIngredients'); // 결과가 null이면 "noIngredients" 페이지 렌더링
    } else {
      res.render('ingredients', { recipes }); // 결과가 있으면 "ingredients" 페이지 렌더링
    }
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Error fetching recipes');
  }
});

router.get('/detailIngredients', async (req, res) => {
  try {
    const { id } = req.query; // URL의 id 매개변수 값 가져오기

    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information`,
      {
        params: {
          apiKey: 'mykey',
        },
      },
    );

    const recipe = response.data;

    res.render('detailIngredients', { recipe });
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    res.status(500).send('Error fetching recipe details');
  }
});

router.get('/mypage', isLoggedIn, (req, res) => {
  // 사용자 정보를 가져오는 로직
  const user_id = req.user.id;

  User.findOne({ where: { id: user_id } })
    .then((user) => {
      if (user) {
        // 사용자가 작성한 글 가져오기
        Post.findAll({
          attributes: ['title', 'post_id'], // 'title' 열만 선택
          where: { user_id: user_id },
        })
          .then((posts) => {
            const recipePosts = posts.map((post) => ({
              title: post.title,
              post_id: post.post_id,
            }));

            res.render('mypage', {
              user: user,
              recipePosts: recipePosts,
            });
          })
          .catch((err) => {
            console.log('Error:', err);
            res.redirect('/');
          });
      } else {
        console.log('User not found');
        res.redirect('/');
      }
    })
    .catch((err) => {
      console.log('Error:', err);
      res.redirect('/');
    });
});

router.delete('/myPage/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    await Post.destroy({
      where: { post_id: postId },
    });

    res.redirect('/mypage'); // 삭제 후 마이페이지로 리다이렉션
  } catch (error) {
    console.error(error);
    res.status(500).send('게시물 삭제 중 오류가 발생했습니다.');
  }
});

// GET 요청에 대한 Random Cook 렌더링
router.get('/randomCook', isLoggedIn, async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.spoonacular.com/recipes/random',
      {
        params: {
          apiKey: 'mykey',
          number: 1,
        },
      },
    );

    const recipe = response.data.recipes[0];

    res.render('randomCook', { recipe }); // randomCook.ejs 파일로 이동하면서 recipe 객체를 전달
  } catch (error) {
    console.error('Error fetching random recipe:', error);
    res.status(500).send('Error fetching random recipe');
  }
});

router.get('/shareCook', isLoggedIn, async (req, res) => {
  try {
    // 게시물과 작성자 정보를 함께 조회하기 위해 JOIN 사용
    const posts = await Post.findAll({
      attributes: ['post_id', 'user_id', 'title', 'created_at', 'content'], // user_id와 title 필드만 가져옴
      include: [
        {
          model: User,
          attributes: ['username'],
        },
      ],
    });

    const formattedPosts = posts.map((post) => ({
      post_id: post.post_id,
      user_id: post.user_id,
      title: post.title,
      username: post.user.username,
    }));

    console.log(formattedPosts);

    res.render('shareCook', { posts: formattedPosts });
  } catch (error) {
    console.error(error);
    res.status(500).send('게시물 조회 중 오류가 발생했습니다.');
  }
});

router.get('/shareCookDetail/:postId', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findOne({
      where: { post_id: postId },
      attributes: ['post_id', 'user_id', 'title', 'created_at', 'content'],
      include: [
        {
          model: User,
          attributes: ['username'],
        },
      ],
    });

    if (post) {
      const formattedPost = {
        post_id: post.post_id,
        title: post.title,
        username: post.user.username,
        content: post.content,
        created_at: post.created_at,
      };

      console.log(formattedPost);
      res.render('shareCookDetail', { post: formattedPost });
    } else {
      console.log('Post not found');
      res.redirect('/shareCook'); // 게시물이 없으면 shareCook 페이지로 리다이렉션
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('게시물 조회 중 오류가 발생했습니다.');
  }
});

router.put('/shareCookDetail/:postId', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;
    const { content } = req.body;

    const post = await Post.findOne({
      attributes: ['post_id', 'user_id', 'title', 'created_at', 'content'],
      include: [
        {
          model: User,
          attributes: ['username'],
        },
      ],
      where: { post_id: postId },
    });

    if (post) {
      post.content = content; // 새로운 내용으로 업데이트
      await post.save(); // 변경 내용을 저장

      res.status(200).send('게시물 내용이 수정되었습니다.');
    } else {
      console.log('Post not found');
      res.status(404).send('게시물을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('게시물 수정 중 오류가 발생했습니다.');
  }
});

router.get('/shareWrite', isLoggedIn, (req, res) => {
  res.render('shareWrite'); // shareWrite.ejs 파일로 이동
});

router.post('/shareWrite', upload.array('photos', 10), async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id; // 로그인한 사용자의 ID

  try {
    const files = req.files; // 업로드된 파일들의 정보
    const photos = files.map((file) => ({
      file_url: file.path, // 업로드된 파일의 경로
      file_name: file.filename, // 업로드된 파일의 이름
    }));

    const post = await Post.create({
      user_id: userId,
      title: title,
      content: content,
      photos: photos, // 업로드된 파일 정보를 포함한 배열
    });

    console.log('title', title);
    console.log('content', content);
    console.log('photos', photos);

    res.redirect('/shareCook');
  } catch (error) {
    console.error(error);
    res.status(500).send('글 저장 중 오류가 발생했습니다.');
  }
});

module.exports = router;
