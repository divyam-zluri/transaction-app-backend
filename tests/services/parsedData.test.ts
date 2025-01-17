import { TransactionService } from '../../src/services/parsedData.service';
import Papa from 'papaparse';
import fs from 'fs/promises';
import { getEntityManager } from '../../src/utils/orm';
import { Transaction } from '../../src/entities/transactions';
import { formatDate, getConversionRate } from '../../src/services/parserHelper.service';

jest.mock('fs/promises');
jest.mock('papaparse');
jest.mock('../../src/utils/orm');
jest.mock('../../src/services/parserHelper.service');

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error for an empty CSV file', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\n');
    (Papa.parse as jest.Mock).mockReturnValue({ data: [] });

    await expect(transactionService.parseAndStoreTransactions('dummyPath')).rejects.toThrow('CSV file is empty');

    expect(Papa.parse).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      delimiter: ",",
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: expect.any(Function),
    }));

    // Verify that transformHeader is called
    const transformHeader = (Papa.parse as jest.Mock).mock.calls[0][1].transformHeader;
    expect(transformHeader('  header  ')).toBe('header');
  });

  it('should parse valid transactions and store them', async () => {
    const mockData = [
      { Date: '01-01-2023', Description: 'Test Transaction', Amount: 100, Currency: 'USD' },
      { Date: '02-01-2023', Description: 'Another Transaction', Amount: 200, Currency: 'EUR' },
    ];

    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\n01-01-2023,Test Transaction,100,USD\n02-01-2023,Another Transaction,200,EUR\n');
    (Papa.parse as jest.Mock).mockReturnValue({ data: mockData });
    (getEntityManager as jest.Mock).mockResolvedValue({
      find: jest.fn().mockResolvedValue([]), // No existing transactions
      persistAndFlush: jest.fn(),
    });
    (formatDate as jest.Mock).mockImplementation((date) => new Date(date));
    (getConversionRate as jest.Mock).mockImplementation((currency) => currency === 'USD' ? 75 : 85); // Mock conversion rates

    const result = await transactionService.parseAndStoreTransactions('dummyPath');

    expect(result.validTransactions.length).toBe(2);
    expect(result.warnings.length).toBe(0);
  });

  it('should return warnings for invalid records', async () => {
    const mockData = [
      { Date: '', Description: 'Invalid Transaction', Amount: -100, Currency: 'USD' },
      { Date: '03-01-2023', Description: '', Amount: 200, Currency: '' },
    ];

    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\n,,,-100,USD\n03-01-2023,,200,\n');
    (Papa.parse as jest.Mock).mockReturnValue({ data: mockData });
    (getEntityManager as jest.Mock).mockResolvedValue({
      find: jest.fn().mockResolvedValue([]), // No existing transactions
      persistAndFlush: jest.fn(),
    });
    (formatDate as jest.Mock).mockImplementation((date) => new Date(date));
    (getConversionRate as jest.Mock).mockImplementation(() => 75); // Mock conversion rates

    const result = await transactionService.parseAndStoreTransactions('dummyPath');

    expect(result.validTransactions.length).toBe(0);
    expect(result.warnings.length).toBe(2); // Expecting two warnings
  });

  it('should handle duplicate transactions', async () => {
    const mockData = [
      { Date: '01-01-2023', Description: 'Duplicate Transaction', Amount: 100, Currency: 'USD' },
      { Date: '01-01-2023', Description: 'Duplicate Transaction', Amount: 100, Currency: 'USD' },
    ];

    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\n01-01-2023,Duplicate Transaction,100,USD\n01-01-2023,Duplicate Transaction,100,USD\n');
    
    const existingTransaction = new Transaction();
    existingTransaction.date = new Date('2023-01-01');
    existingTransaction.description = 'Duplicate Transaction';
    
    (getEntityManager as jest.Mock).mockResolvedValue({
      find: jest.fn().mockResolvedValue([existingTransaction]), // Return existing transaction
      persistAndFlush: jest.fn(),
    });

    (Papa.parse as jest.Mock).mockReturnValue({ data: mockData });
    
    const result = await transactionService.parseAndStoreTransactions('dummyPath');

    expect(result.validTransactions.length).toBe(1);
    expect(result.warnings.length).toBe(1); // Expecting one warning for duplicate
  });

  it('should return warnings for invalid currency code', async () => {
    const mockData = [
      { Date: '01-01-2023', Description: 'Invalid Currency', Amount: 100, Currency: 'XYZ' },
    ];

    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\n01-01-2023,Invalid Currency,100,XYZ\n');
    (Papa.parse as jest.Mock).mockReturnValue({ data: mockData });
    (getEntityManager as jest.Mock).mockResolvedValue({
      find: jest.fn().mockResolvedValue([]), // No existing transactions
      persistAndFlush: jest.fn(),
    });
    (formatDate as jest.Mock).mockImplementation((date) => new Date(date));
    (getConversionRate as jest.Mock).mockImplementation(() => null); // Invalid currency code

    const result = await transactionService.parseAndStoreTransactions('dummyPath');

    expect(result.validTransactions.length).toBe(0);
    expect(result.warnings.length).toBe(1); // Expecting one warning for invalid currency code
  });

  it('should return warnings for invalid date format', async () => {
    const mockData = [
      { Date: 'invalid-date', Description: 'Invalid Date Format', Amount: 100, Currency: 'USD' },
    ];

    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\ninvalid-date,Invalid Date Format,100,USD\n');
    (Papa.parse as jest.Mock).mockReturnValue({ data: mockData });
    (getEntityManager as jest.Mock).mockResolvedValue({
      find: jest.fn().mockResolvedValue([]), // No existing transactions
      persistAndFlush: jest.fn(),
    });
    (formatDate as jest.Mock).mockImplementation(() => null); // Invalid date format
    (getConversionRate as jest.Mock).mockImplementation(() => 75); // Mock conversion rates

    const result = await transactionService.parseAndStoreTransactions('dummyPath');

    expect(result.validTransactions.length).toBe(0);
    expect(result.warnings.length).toBe(1); // Expecting one warning for invalid date format
  });

  it('should return warnings for invalid date', async () => {
    const mockData = [
      { Date: '32-01-2023', Description: 'Invalid Date', Amount: 100, Currency: 'USD' },
    ];

    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\n32-01-2023,Invalid Date,100,USD\n');
    (Papa.parse as jest.Mock).mockReturnValue({ data: mockData });
    (getEntityManager as jest.Mock).mockResolvedValue({
      find: jest.fn().mockResolvedValue([]), // No existing transactions
      persistAndFlush: jest.fn(),
    });
    (formatDate as jest.Mock).mockImplementation((date) => new Date(date));
    (getConversionRate as jest.Mock).mockImplementation(() => 75); // Mock conversion rates

    const result = await transactionService.parseAndStoreTransactions('dummyPath');

    expect(result.validTransactions.length).toBe(0);
    expect(result.warnings.length).toBe(1); // Expecting one warning for invalid date
  });

  it('should return warnings for invalid record with string in Amount', async () => {
    const mockData = [
      { Date: '01-01-2023', Description: 'Invalid Amount', Amount: 'NotANumber', Currency: 'USD' },
    ];
  
    // Mock dependencies
    (fs.readFile as jest.Mock).mockResolvedValue('Date,Description,Amount,Currency\n01-01-2023,Invalid Amount,NotANumber,USD\n');
    (Papa.parse as jest.Mock).mockReturnValue({ data: mockData });
    (getEntityManager as jest.Mock).mockResolvedValue({
      find: jest.fn().mockResolvedValue([]), // No existing transactions
      persistAndFlush: jest.fn(),
    });
    (formatDate as jest.Mock).mockImplementation((date) => new Date(date));
    (getConversionRate as jest.Mock).mockImplementation(() => 75); // Mock conversion rates
  
    // Execute the service
    const result = await transactionService.parseAndStoreTransactions('dummyPath');
  
    // Assertions
    expect(result.validTransactions.length).toBe(0);
    expect(result.warnings.length).toBe(1); // One warning for the invalid Amount
    expect(result.warnings[0]).toContain(
      'Invalid record: {"Date":"01-01-2023","Description":"Invalid Amount","Amount":"NotANumber","Currency":"USD"}'
    );    
  });
});