// isLoggedIn 함수
// 로그인된 상태이면 다음 미들웨어로 연결
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    res.redirect('/login')
  }
}

// isNotLoggedIn 함수
// 로그인 안된 상태이면 다음 미들웨어로 연결
exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next()
  } else {
    const message = encodeURIComponent('로그인한 상태입니다.')
    res.redirect(`/?error=${message}`)
  }
}
