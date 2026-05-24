import { Alert, Button, Result, Spin } from 'antd';

export function LoadingView({ tip = 'Đang tải dữ liệu...' }) {
  return (
    <div className="center-box">
      <Spin size="large" tip={tip} />
    </div>
  );
}

export function ErrorView({ message = 'Có lỗi xảy ra', onRetry }) {
  return (
    <Result
      status="error"
      title="Tải thất bại"
      subTitle={message}
      extra={
        onRetry ? (
          <Alert
            type="error"
            showIcon
            message="Vui lòng thử lại"
            action={
              <Button type="link" onClick={onRetry}>
                Thử lại
              </Button>
            }
          />
        ) : null
      }
    />
  );
}
