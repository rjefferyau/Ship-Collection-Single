import React from 'react';
import Link from 'next/link';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

const Custom404: React.FC = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            size="4x" 
            className="text-warning mb-4" 
          />
          
          <h1 className="display-4 mb-4">404 - Page Not Found</h1>
          
          <p className="lead mb-5">
            The starship you're looking for seems to have warped to another dimension.
            Our sensors cannot locate the requested page in this sector of space.
          </p>
          
          <Link href="/" passHref>
            <Button variant="primary" size="lg">
              <FontAwesomeIcon icon={faHome} className="me-2" />
              Return to Starfleet
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default Custom404; 