import React from 'react';
import {
  Button, List, Card, Icon,
} from 'antd';
// import {StopOutlined,} from '@ant-design/icons';
import NicknameEditForm from '../components/NicknameEditForm';

const Profile = () => (
  <div>
    <NicknameEditForm />
    <List
      style={{ marginBottom: '20px' }}
      grid={{ gutter: 4, xs: 2, md: 3 }}
      size="small"
      header={<div>팔로잉 목록</div>}
      loadMore={<Button style={{ width: '100%' }}>더 보기</Button>}
      bordered
      dataSource={['대환권', '천재', 'Bigring']}
      renderItem={(item) => (
        <List.Item style={{ marginTop: '20px' }}>
          <Card actions={[<Icon type="stop" key="stop" />]}><Card.Meta description={item} /></Card>
        </List.Item>
      )}
    />
    <List
      style={{ marginBottom: '20px' }}
      grid={{ gutter: 4, xs: 2, md: 3 }}
      size="small"
      header={<div>팔로워 목록</div>}
      loadMore={<Button style={{ width: '100%' }}>더 보기</Button>}
      bordered
      dataSource={['대환권', '천재', 'Bigring']}
      renderItem={(item) => (
        <List.Item style={{ marginTop: '20px' }}>
          <Card actions={[<Icon type="stop" key="stop" />]}><Card.Meta description={item} /></Card>
        </List.Item>
      )}
    />
  </div>
);

export default Profile;
