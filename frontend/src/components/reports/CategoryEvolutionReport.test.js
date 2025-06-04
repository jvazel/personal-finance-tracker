import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { fr } from 'date-fns/locale';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import CategoryEvolutionReport from './CategoryEvolutionReport';
import api from '../../services/api'; // To mock api calls

// Mock the api module
jest.mock('../../services/api');

// Mock Recharts ResponsiveContainer and LineChart to avoid rendering issues in JSDOM
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children, data }) => <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
    // Mock other Recharts components used if necessary (e.g., XAxis, YAxis, Tooltip, Legend, CartesianGrid, Line)
    XAxis: () => <div data-testid="xaxis" />,
    YAxis: () => <div data-testid="yaxis" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    CartesianGrid: () => <div data-testid="cartesiangrid" />,
    Line: ({ dataKey }) => <div data-testid={`line-${dataKey}`} />,
  };
});

// Mock react-datepicker - correct handling of default export
jest.mock('react-datepicker', () => {
  const ActualDatePickerModule = jest.requireActual('react-datepicker');
  const ActualDatePickerComponent = ActualDatePickerModule.default;
  // eslint-disable-next-line react/prop-types
  return function MockDatePicker(props) {
    return <ActualDatePickerComponent {...props} />;
  };
});


const mockApiResponse = (data, shouldFail = false) => {
  if (shouldFail) {
    api.get.mockRejectedValueOnce({ response: { data: { message: 'API Error' } } });
  } else {
    api.get.mockResolvedValueOnce({ data });
  }
};

describe('CategoryEvolutionReport', () => {
  const initialStartDate = subMonths(startOfMonth(new Date()), 5);
  const initialEndDate = endOfMonth(new Date());

  beforeEach(() => {
    // Reset mocks before each test
    api.get.mockClear();
  });

  test('renders loading state initially', () => {
    mockApiResponse({ categories: [] }); // Mock an initial successful empty response
    render(<CategoryEvolutionReport />);
    expect(screen.getByText(/Chargement des données.../i)).toBeInTheDocument();
  });

  test('renders with data and displays chart elements', async () => {
    const mockData = {
      categories: [
        {
          name: 'Alimentation',
          evolution: [
            { month: '2023-01', total: 100 },
            { month: '2023-02', total: 120 },
          ],
        },
        {
          name: 'Transport',
          evolution: [
            { month: '2023-01', total: 80 },
            { month: '2023-02', total: 90 },
          ],
        },
      ],
    };
    mockApiResponse(mockData);

    render(<CategoryEvolutionReport />);

    // Wait for the loading to disappear and chart to appear
    await waitFor(() => {
      expect(screen.queryByText(/Chargement des données.../i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      // Check for report title
      expect(screen.getByText('Évolution des Dépenses par Catégorie')).toBeInTheDocument();

      // Check if chart components are rendered (using data-testid from mocks)
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('xaxis')).toBeInTheDocument();
    });

    // These can be checked after the main chart container is confirmed
    expect(screen.getByTestId('yaxis')).toBeInTheDocument();
    expect(screen.getByTestId('yaxis')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
    expect(screen.getByTestId('line-Alimentation')).toBeInTheDocument();
    expect(screen.getByTestId('line-Transport')).toBeInTheDocument();

    // Check for month labels (transformed by the component, e.g., "Jan 23")
    // The actual chart data passed to LineChart mock can be inspected
    await waitFor(() => {
      const chartElement = screen.getByTestId('line-chart');
      const chartData = JSON.parse(chartElement.getAttribute('data-chart-data'));

      expect(chartData.some(d => d.name === format(new Date('2023-01-01'), 'MMM yy', { locale: fr }))).toBe(true);
      expect(chartData.some(d => d.name === format(new Date('2023-02-01'), 'MMM yy', { locale: fr }))).toBe(true);
      expect(chartData[0]['Alimentation']).toBe(100);
      expect(chartData[0]['Transport']).toBe(80);
    });
  });

  test('displays error message when API call fails', async () => {
    mockApiResponse(null, true);
    render(<CategoryEvolutionReport />);

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/API Error/i)).toBeInTheDocument();
  });

  test('displays "no data" message when API returns empty categories', async () => {
    mockApiResponse({ categories: [] });
    render(<CategoryEvolutionReport />);

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Aucune donnée d'évolution de catégorie disponible/i)).toBeInTheDocument();
  });

  test('fetches new data when date pickers are changed and apply button is clicked', async () => {
    mockApiResponse({ categories: [] }); // Initial load
    render(<CategoryEvolutionReport />);

    // Wait for the initial load to complete
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Aucune donnée d'évolution de catégorie disponible/i)).toBeInTheDocument();
    });

    // Mock response for subsequent calls.
    // Each action that triggers a fetch will need its own mock if we use `mockResolvedValueOnce`.
    const newData = {
      categories: [{ name: 'Shopping', evolution: [{ month: '2023-03', total: 150 }] }],
    };

    // screen.debug();

    const startDateInput = screen.getByLabelText('Date de début:');
    const endDateInput = screen.getByLabelText('Date de fin:');
    const applyButton = screen.getByRole('button', { name: /Appliquer/i });

    // api.get called once on initial load.

    // Simulate start date change
    fireEvent.change(startDateInput, { target: { value: '01/03/2023' } });
    // This should trigger setStartDate, then useEffect calls fetchReportData (call #2)
    mockApiResponse(newData); // Mock for call #2
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));

    // Simulate end date change
    fireEvent.change(endDateInput, { target: { value: '31/03/2023' } });
    // This should trigger setEndDate, then useEffect calls fetchReportData (call #3)
    mockApiResponse(newData); // Mock for call #3
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));

    // Simulate "Appliquer" button click
    fireEvent.click(applyButton);
    // This directly calls fetchReportData (call #4)
    mockApiResponse(newData); // Mock for call #4
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(4));

    expect(api.get).toHaveBeenLastCalledWith(
      '/api/reports/category-evolution',
      expect.objectContaining({
        params: {
          startDate: '2023-03-01',
          endDate: '2023-03-31',
        },
      })
    );
    // Check if new data (from newData mock) is displayed
    expect(await screen.findByTestId('line-Shopping')).toBeInTheDocument();
  });
});
