import * as blessed from 'blessed';
import { renderForecastPanel, createForecastPanel, refresh } from './forecastPanel';
import { Forecast, ForecastPoint } from '../history/forecast';

function makePoint(i: number): ForecastPoint {
  return {
    timestamp: Date.now() + (i + 1) * 3_600_000,
    predictedDuration: 60_000 + i * 5_000,
    predictedSuccessRate: 0.9 - i * 0.05,
    confidence: 1 - i * 0.1,
  };
}

function makeForecast(steps = 4): Forecast {
  return {
    generatedAt: Date.now(),
    horizon: steps * 3_600_000,
    points: Array.from({ length: steps }, (_, i) => makePoint(i)),
  };
}

function makeBox(): blessed.Widgets.BoxElement {
  const screen = blessed.screen({ smartCSR: true, terminal: 'xterm' });
  const box = blessed.box({ parent: screen });
  (box as any).screen = screen;
  (box as any).setContent = jest.fn();
  (screen as any).render = jest.fn();
  return box;
}

describe('renderForecastPanel', () => {
  it('calls setContent with forecast header', () => {
    const box = makeBox();
    const forecast = makeForecast();
    renderForecastPanel(box, forecast);
    const content: string = (box.setContent as jest.Mock).mock.calls[0][0];
    expect(content).toContain('Generated:');
    expect(content).toContain('Horizon:');
  });

  it('renders a row for each forecast point', () => {
    const box = makeBox();
    const forecast = makeForecast(3);
    renderForecastPanel(box, forecast);
    const content: string = (box.setContent as jest.Mock).mock.calls[0][0];
    expect(content).toContain('T+1');
    expect(content).toContain('T+2');
    expect(content).toContain('T+3');
  });

  it('shows fallback message when no points', () => {
    const box = makeBox();
    renderForecastPanel(box, { generatedAt: Date.now(), horizon: 0, points: [] });
    const content: string = (box.setContent as jest.Mock).mock.calls[0][0];
    expect(content).toContain('No forecast data');
  });

  it('renders confidence bars', () => {
    const box = makeBox();
    renderForecastPanel(box, makeForecast(2));
    const content: string = (box.setContent as jest.Mock).mock.calls[0][0];
    expect(content).toContain('[');
    expect(content).toContain(']');
  });
});

describe('refresh', () => {
  it('delegates to renderForecastPanel', () => {
    const box = makeBox();
    const forecast = makeForecast(2);
    refresh(box, forecast);
    expect((box.setContent as jest.Mock)).toHaveBeenCalledTimes(1);
  });
});
