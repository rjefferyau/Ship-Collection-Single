import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Head from 'next/head';

// NOTE: Do NOT import the Layout component here
// The Layout is already applied globally in _app.tsx

const PageTemplate: React.FC = () => {
  // Your state and hooks
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Your initialization code
    const fetchData = async () => {
      try {
        // Fetch data here
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <>
      {/* Optional: Add page-specific head content */}
      <Head>
        <title>Page Title - Starship Collection Manager</title>
      </Head>
      
      {/* Main content - this will be wrapped by the Layout component from _app.tsx */}
      <Container fluid>
        <h1 className="mb-4">Page Title</h1>
        
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>Card Title</Card.Header>
              <Card.Body>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <p>Your content here</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default PageTemplate;

// INSTRUCTIONS:
// 1. Copy this file to pages/your-page-name.tsx
// 2. Rename PageTemplate to YourPageName
// 3. Update the content as needed
// 4. Add your page path to the activeTab detection in _app.tsx 