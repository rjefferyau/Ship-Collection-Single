import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Row, Col, Breadcrumb, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChartBar } from '@fortawesome/free-solid-svg-icons';

import Statistics from '../components/Statistics';

interface StatisticsData {
  totalStarships: number;
  ownedStarships: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number } };
}

const StatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalStarships: 0,
    ownedStarships: 0,
    factionBreakdown: {},
    editionBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      const starships = data.data || [];
      
      // Calculate statistics
      const totalStarships = starships.length;
      const ownedStarships = starships.filter((s: any) => s.owned).length;
      
      // Calculate faction breakdown
      const factionBreakdown: { [key: string]: { total: number; owned: number } } = {};
      starships.forEach((starship: any) => {
        const faction = starship.faction;
        if (!factionBreakdown[faction]) {
          factionBreakdown[faction] = { total: 0, owned: 0 };
        }
        factionBreakdown[faction].total++;
        if (starship.owned) {
          factionBreakdown[faction].owned++;
        }
      });
      
      // Calculate edition breakdown
      const editionBreakdown: { [key: string]: { total: number; owned: number } } = {};
      starships.forEach((starship: any) => {
        const edition = starship.edition;
        if (!editionBreakdown[edition]) {
          editionBreakdown[edition] = { total: 0, owned: 0 };
        }
        editionBreakdown[edition].total++;
        if (starship.owned) {
          editionBreakdown[edition].owned++;
        }
      });
      
      setStatistics({
        totalStarships,
        ownedStarships,
        factionBreakdown,
        editionBreakdown
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Statistics - Starship Collection Manager</title>
      </Head>

      <div className="mb-4">
        <h1>Collection Statistics</h1>
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link href="/" className="text-decoration-none">
              <FontAwesomeIcon icon={faHome} className="me-2" /> Home
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faChartBar} className="me-2" /> Statistics
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading statistics...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <Statistics
              totalStarships={statistics.totalStarships}
              ownedStarships={statistics.ownedStarships}
              factionBreakdown={statistics.factionBreakdown}
              editionBreakdown={statistics.editionBreakdown}
              viewMode="all"
            />
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default StatisticsPage; 