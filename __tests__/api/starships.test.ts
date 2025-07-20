import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/starships/[id]';
import dbConnect from '../../lib/mongodb';
import Starship from '../../models/Starship';

// Mock the database connection
jest.mock('../../lib/mongodb');
jest.mock('../../models/Starship');

const mockedDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockedStarship = Starship as jest.Mocked<typeof Starship>;

describe('/api/starships/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDbConnect.mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('should return a starship when valid ObjectId is provided', async () => {
      const mockStarship = {
        _id: '687c2b5129bc04632f78e5cc',
        shipName: 'USS Enterprise',
        edition: 'TNG',
        issue: '001',
        faction: 'Federation',
        owned: true,
        toJSON: () => ({
          _id: '687c2b5129bc04632f78e5cc',
          shipName: 'USS Enterprise',
          edition: 'TNG',
          issue: '001',
          faction: 'Federation',
          owned: true,
        }),
      };

      mockedStarship.findById = jest.fn().mockResolvedValue(mockStarship);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '687c2b5129bc04632f78e5cc' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.shipName).toBe('USS Enterprise');
      expect(mockedStarship.findById).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return 404 when starship is not found', async () => {
      mockedStarship.findById = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '687c2b5129bc04632f78e5cc' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.message).toBe('Starship not found');
    });

    it('should return 400 when invalid ObjectId is provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'invalid-id' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid Starship ID format');
    });
  });

  describe('PUT', () => {
    it('should update a starship when valid data is provided', async () => {
      const mockUpdatedStarship = {
        _id: '687c2b5129bc04632f78e5cc',
        shipName: 'USS Enterprise',
        retailPrice: 29.99,
        toJSON: () => ({
          _id: '687c2b5129bc04632f78e5cc',
          shipName: 'USS Enterprise',
          retailPrice: 29.99,
        }),
      };

      mockedStarship.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedStarship);

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: '687c2b5129bc04632f78e5cc' },
        body: { retailPrice: 29.99 },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.retailPrice).toBe(29.99);
      expect(mockedStarship.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        { retailPrice: 29.99 },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 when trying to update non-existent starship', async () => {
      mockedStarship.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: '687c2b5129bc04632f78e5cc' },
        body: { retailPrice: 29.99 },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.message).toBe('Starship not found');
    });
  });

  describe('DELETE', () => {
    it('should delete a starship when valid ObjectId is provided', async () => {
      const mockDeletedStarship = {
        _id: '687c2b5129bc04632f78e5cc',
        shipName: 'USS Enterprise',
      };

      mockedStarship.findByIdAndDelete = jest.fn().mockResolvedValue(mockDeletedStarship);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '687c2b5129bc04632f78e5cc' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toEqual({});
      expect(mockedStarship.findByIdAndDelete).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  it('should return 405 for unsupported methods', async () => {
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { id: '687c2b5129bc04632f78e5cc' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.message).toBe('Method not allowed');
  });
});