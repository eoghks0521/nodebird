const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../models');
const passport = require('passport');
const { isLoggedIn } = require('./middleware');

const router = express.Router();

router.get('/', isLoggedIn, (req, res) => {
  const user = Object.assign({}, req.user.toJSON());
  delete user.password;
  console.log(user);
  return res.json(user);
});
router.post('/', async(req, res, next) => {
  try{
    const exUser = await db.User.findOne({
      where: {
        userId: req.body.userId,
      },
    });
    if(exUser) {
      return res.status(404).send('이미 사용중인 아이디입니다.');
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const newUser = await db.User.create({
      nickname: req.body.nickname,
      userId: req.body.userId,
      password: hashedPassword,
    });
    console.log(newUser);
    return res.status(200).json(newUser);
  }catch(e){
    console.error(e);
    //return res.status(403).send(e);
    //에러처리 여기서 -> 그냥 넘기면 에러가 그대로 노출된다.
    return next(e);
  }
});
router.get('/:id', async (req, res, next) => {
  try{
    const user = await db.User.findOne({
      where: { id: parseInt(req.params.id, 10) },
      include: [{
        model: db.Post,
        as: 'Posts',
        attributes: ['id'],
      }, {
        model: db.User,
        as: 'Followings',
        attributes: ['id'],
      }, {
        model: db.User,
        as: 'Followers',
        attributes: ['id'],
      }],
      attributes: ['id', 'nickname'],
    });
    const jsonUser = user.toJSON();
    jsonUser.Posts = jsonUser.Post ? jsonUser.Post.length: 0;
    jsonUser.Followings = jsonUser.Followings ? jsonUser.Followings.length: 0;
    jsonUser.Followers = jsonUser.Followers ? jsonUser.Followers.length: 0;
    res.json(jsonUser);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.get('/hashtag/:name') //next 동적으로 와일드카드 값을 바꿀 수가 없다 따라서 next에 express를 연결시켜주어야함, 버전 9부터는 가능

router.post('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('logout 성공');
});
router.post('/login', (req, res, next) => {
  //콜백 함수 인자로써 local 파일의 done에서 넣어준 값들이 들어온다.
  //카카오 네이버 로그인이면 그 전략 파일을 불러와라
  passport.authenticate('local', (err, user, info) => {
    if(err){
      console.error(err);
      return next(err);
    }
    if(info){
      return res.status(401).send(info.reason);
    }
    return req.login(user, async (loginErr) => {
      try {
        if (loginErr) {
          return next(loginErr);
        }
        //얕은 복사
        const fullUser = await db.User.findOne({
          where: {id: user.id},
          include: [{
            model: db.Post,
            as: 'Posts', //associate에서 as를 넣어줬으면 똑같이 넣어주어야한다.
            attributes: ['id'],
          }, {
            model: db.User,
            as: 'Followings',
            attributes: ['id'],
          }, {
            model: db.User,
            as: 'Followers',
            attributes: ['id'],
          }],
          attributes: ['id', 'nickname', 'userId'],
        });
        console.log(fullUser);
        return res.json(fullUser);
      }catch (e) {
        next(e);
      }
    });
  })(req, res, next);
});


router.get('/:id/followings', isLoggedIn, async (req, res, next) => {
  try {
    const user = await db.User.findOne({
      // 시퀄라이즈에서는 where 절에 undefined가 들어가면 에러가 발생하기 때문에
      // 에러를 막기 위해 0을 넣음. 0이 들어가는 경우는 아무것도 검색되지 않습니다.
      where: { id: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0 },
    });
    const followers =await user.getFollowings({
      attributes: ['id', 'nickname'],
      limit: parseInt(req.query.limit, 10),
      offset: parseInt(req.query.offset, 10),
    });
    res.json(followers);
  } catch (e) {
    console.error(e);
    next(e);  
  }
});
router.get('/:id/followers', isLoggedIn, async (req, res, next) => {
  try {
    const user = await db.User.findOne({
      where: { id: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0 },
    });
    const followers =await user.getFollowers({
      attributes: ['id', 'nickname'],
      limit: parseInt(req.query.limit, 10),
      offset: parseInt(req.query.offset, 10),
    });
    res.json(followers);
  } catch (e) {
    console.error(e);
    next(e);  
  }
});
router.delete('/:id/follower', async (req, res, next) => {
  try{
    const me = await db.User.findOne({
      where: { id: req.user.id },
    });
    await me.removeFollower(req.params.id);
    res.send(req.params.id);
  }catch (e) {
    console.error(e);
    next(e);
  }
});

router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try{
    const me = await db.User.findOne({
        where: {id: req.user.id},
    });
    await me.addFollowing(req.params.id);
    res.send(req.params.id);
  } catch (e) {
    console.error(e);
    next(e);
  }
});
router.delete('/:id/follow', isLoggedIn, async (req, res, next) => {
  try{
    const me = await db.User.findOne({
        where: {id: req.user.id},
    });
    await me.removeFollowing(req.params.id);
    res.send(req.params.id);
  } catch (e) {
    console.error(e);
    next(e);
  }
});
router.delete('/:id/follower', (req, res) => {

});
router.get('/:id/posts', async (req, res, next) => {
  try{
    let where = {
      UserId: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0,
      RetweetId: null,
    };
    if (parseInt(req.query.lastId, 10)){
      where.id = {
          [db.Sequelize.Op.lt]: parseInt(req.query.lastId, 10), //lt 속성은 less than, 전체적 의미는 lastId보다 작은 id를 가져온다.
      };
    }
    const posts = await db.Post.findAll({
      where,
      include: [{
        model: db.User,
        attributes: ['id', 'nickname'],
      }, {
        model: db.Image,
      }, {
        model: db.User,
        through: 'Like',
        as: 'Likers',
        attributes: ['id'],
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(req.query.limit, 10),
    });
    res.json(posts);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.patch('/nickname', isLoggedIn, async (req, res, next) => {
  try{
    await db.User.update({
      nickname: req.body.nickname,
    }, {
      where: { id: req.user.id },
    });
    res.send(req.body.nickname);
  } catch (e) {
    console.error(e);
    next(e);
  }
})
module.exports = router;
