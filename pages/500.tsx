import React from 'react';
import Link from 'next/link';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faHome, faRedo } from '@fortawesome/free-solid-svg-icons';

const Custom500: React.FC = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <FontAwesomeIcon 
            icon={faExclamationCircle} 
            size="4x" 
            className="text-danger mb-4" 
          />
          
          <h1 className="display-4 mb-4">500 - Server Error</h1>
          
          <p className="lead mb-5">
            We've encountered a warp core breach in our systems.
            Our engineering team has been notified and is working to resolve the issue.
          </p>
          
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => window.location.reload()}
            >
              <FontAwesomeIcon icon={faRedo} className="me-2" />
              Try Again
            </Button>
            
            <Link href="/" passHref>
              <Button variant="primary" size="lg">
                <FontAwesomeIcon icon={faHome} className="me-2" />
                Return to Bridge
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Custom500; 