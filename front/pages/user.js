import React, { useEffect } from 'react';
import PropsTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Avatar, Card } from 'antd';
import PostCard from '../components/PostCard';
import { LOAD_USER_POSTS_REQUEST } from '../reducers/post';
import { LOAD_USER_REQUEST } from '../reducers/user';

// props는 getIntialProps에서 return 하면 들어온다.
const User = ({ id }) => {
  const dispatch = useDispatch();
  const { mainPosts } = useSelector((state) => state.post);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch({
      type: LOAD_USER_REQUEST,
      data: id,
    });
    dispatch({
      type: LOAD_USER_POSTS_REQUEST,
      data: id,
    });
  }, []);
  return (
    <div>
      {userInfo
        ? (
          <Card
            actions={[
              <div key="twit">
                짹짹
                <br />
                {userInfo.Posts}
              </div>,
              <div key="followings">
                팔로잉
                <br />
                {userInfo.Followings}
              </div>,
              <div key="followers">
                팔로워
                <br />
                {userInfo.Followers}
              </div>,
            ]}
          >
            <Card.Meta
              avatar={<Avatar>{userInfo.nickname[0]}</Avatar>}
              title={userInfo.nickname}
            />
          </Card>
        )
        : null}
      {mainPosts.map(c => (
        <PostCard key={+c.createdAt} post={c} />
      ))}
    </div>
  );
};

User.propTypes = {
  id: PropsTypes.number.isRequired,
};

User.getInitialProps = async (context) => {
  console.log('hashtag getInitialProps', context.query.id);
  return { id: parseInt(context.query.id, 10) };
};
export default User;
