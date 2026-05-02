import { LeftOutlined, RightOutlined, ZoomInOutlined } from '@ant-design/icons';
import { Button, Carousel, Empty, Modal, Space } from 'antd';
import { useState } from 'react';

function ImageGallery({ images, height = 360 }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return <Empty description="No images" />;
  }

  const openPreview = (index) => {
    setActiveIndex(index);
    setIsPreviewOpen(true);
  };

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  return (
    <>
      <Carousel autoplay dots={{ className: 'gallery-dots' }}>
        {images.map((image, index) => (
          <div key={image}>
            <button
              type="button"
              className="gallery-image-button"
              onClick={() => openPreview(index)}
              aria-label={`Open image ${index + 1}`}
            >
              <img
                src={image}
                alt={`gallery-${index + 1}`}
                style={{
                  width: '100%',
                  height,
                  objectFit: 'cover',
                  borderRadius: 16
                }}
              />
              <span className="gallery-zoom-badge">
                <ZoomInOutlined /> Xem lon
              </span>
            </button>
          </div>
        ))}
      </Carousel>

      <Modal
        open={isPreviewOpen}
        footer={null}
        onCancel={() => setIsPreviewOpen(false)}
        width={980}
        centered
        className="gallery-preview-modal"
      >
        <div className="gallery-preview-wrapper">
          <img
            src={images[activeIndex]}
            alt={`preview-${activeIndex + 1}`}
            className="gallery-preview-image"
          />
          <Button
            type="primary"
            shape="circle"
            icon={<LeftOutlined />}
            className="gallery-nav-button gallery-nav-prev"
            onClick={showPrevious}
            aria-label="Previous image"
          />
          <Button
            type="primary"
            shape="circle"
            icon={<RightOutlined />}
            className="gallery-nav-button gallery-nav-next"
            onClick={showNext}
            aria-label="Next image"
          />
          <Space className="gallery-index-badge">
            {activeIndex + 1} / {images.length}
          </Space>
        </div>
      </Modal>
    </>
  );
}

export default ImageGallery;
