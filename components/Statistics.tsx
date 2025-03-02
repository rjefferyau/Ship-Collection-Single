import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShip, faCheck, faPercentage, faList } from '@fortawesome/free-solid-svg-icons';

interface StatisticsProps {
  totalStarships: number;
  ownedStarships: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number } };
}

const Statistics: React.FC<StatisticsProps> = ({
  totalStarships,
  ownedStarships,
  factionBreakdown,
  editionBreakdown
}) => {
  const ownedPercentage = totalStarships > 0 
    ? Math.round((ownedStarships / totalStarships) * 100) 
    : 0;

  return (
    <div className="mb-4">
      <h3 className="mb-3">Collection Statistics</h3>
      
      <Row>
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <FontAwesomeIcon icon={faList} size="2x" className="mb-2 text-primary" />
              <h5>Total Starships</h5>
              <div className="display-4">{totalStarships}</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <FontAwesomeIcon icon={faCheck} size="2x" className="mb-2 text-success" />
              <h5>Owned Starships</h5>
              <div className="display-4">{ownedStarships}</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} sm={12} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="text-center">
                <FontAwesomeIcon icon={faPercentage} size="2x" className="mb-2 text-info" />
                <h5>Collection Completion</h5>
              </div>
              <div className="display-4 text-center mb-2">{ownedPercentage}%</div>
              <ProgressBar 
                now={ownedPercentage} 
                variant={ownedPercentage < 25 ? "danger" : ownedPercentage < 50 ? "warning" : ownedPercentage < 75 ? "info" : "success"} 
                className="mb-0"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {Object.keys(factionBreakdown).length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Faction Breakdown</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(factionBreakdown)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([faction, data]) => {
                  const percentage = data.total > 0 
                    ? Math.round((data.owned / data.total) * 100) 
                    : 0;
                    
                  return (
                    <Col md={4} sm={6} key={faction} className="mb-3">
                      <div className="mb-1">
                        <strong>{faction}</strong>
                        <span className="float-end">
                          {data.owned}/{data.total} ({percentage}%)
                        </span>
                      </div>
                      <ProgressBar 
                        now={percentage} 
                        variant={percentage < 25 ? "danger" : percentage < 50 ? "warning" : percentage < 75 ? "info" : "success"} 
                      />
                    </Col>
                  );
                })}
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {Object.keys(editionBreakdown).length > 0 && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Edition Breakdown</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(editionBreakdown)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([edition, data]) => {
                  const percentage = data.total > 0 
                    ? Math.round((data.owned / data.total) * 100) 
                    : 0;
                    
                  return (
                    <Col md={4} sm={6} key={edition} className="mb-3">
                      <div className="mb-1">
                        <strong>{edition}</strong>
                        <span className="float-end">
                          {data.owned}/{data.total} ({percentage}%)
                        </span>
                      </div>
                      <ProgressBar 
                        now={percentage} 
                        variant={percentage < 25 ? "danger" : percentage < 50 ? "warning" : percentage < 75 ? "info" : "success"} 
                      />
                    </Col>
                  );
                })}
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Statistics; 