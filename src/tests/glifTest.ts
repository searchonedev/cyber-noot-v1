import { describe, test, expect, beforeEach, jest } from 'bun:test';
import { GlifTool, GLIF_MODELS } from '../tools/glifTool';
import axios from 'axios';

// Mock environment variables
process.env.GLIF_API_KEY = 'test-key';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GlifTool', () => {
  let glifTool: GlifTool;

  beforeEach(() => {
    glifTool = new GlifTool();
    // Reset axios mocks
    mockedAxios.post.mockReset();
  });

  describe('constructor', () => {
    test('throws error when GLIF_API_KEY is missing', () => {
      const originalKey = process.env.GLIF_API_KEY;
      delete process.env.GLIF_API_KEY;
      
      expect(() => new GlifTool()).toThrow('GLIF_API_KEY environment variable is required');
      
      process.env.GLIF_API_KEY = originalKey;
    });
  });

  describe('generateImage', () => {
    test('successfully generates image with default model', async () => {
      const mockResponse = { data: { url: 'https://example.com/image.jpg' } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await glifTool.generateImage('A magical treehouse');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://simple-api.glif.app',
        {
          id: GLIF_MODELS.bitcoinPuppets.id,
          inputs: ['A magical treehouse']
        },
        expect.any(Object)
      );

      expect(result).toEqual({
        type: 'image',
        image_url: { url: 'https://example.com/image.jpg' }
      });
    });

    test('uses correct model based on trigger word', async () => {
      const mockResponse = { data: { url: 'https://example.com/noot.jpg' } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await glifTool.generateImage('Create a $noot penguin in space');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://simple-api.glif.app',
        {
          id: GLIF_MODELS.nootNoot.id,
          inputs: ['Create a $noot penguin in space']
        },
        expect.any(Object)
      );
    });

    test('handles API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(glifTool.generateImage('test prompt'))
        .rejects
        .toThrow('API Error');
    });

    test('throws error for empty prompt', async () => {
      await expect(glifTool.generateImage(''))
        .rejects
        .toThrow('Prompt is required');
    });

    test('handles invalid API response', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await expect(glifTool.generateImage('test prompt'))
        .rejects
        .toThrow('Invalid response from Glif API');
    });

    test('uses provided modelId when specified', async () => {
      const mockResponse = { data: { url: 'https://example.com/custom.jpg' } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      const customModelId = 'custom-model-id';

      await glifTool.generateImage('test prompt', customModelId);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://simple-api.glif.app',
        {
          id: customModelId,
          inputs: ['test prompt']
        },
        expect.any(Object)
      );
    });
  });
}); 