import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Page not found"
      extra={
        <Button type="primary">
          <Link to="/">Go Home</Link>
        </Button>
      }
    />
  );
}

export default NotFoundPage;
