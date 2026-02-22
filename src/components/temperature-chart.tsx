'use client';

import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartDataPoint {
  created_at: string;
  temperature: number;
}

interface TemperatureChartProps {
  data: ChartDataPoint[];
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  // Format data for Recharts
  const chartData = useMemo(() => {
    return (
      [...data]
        // Sort chronologically ascending
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
        .map((item) => {
          const date = parseISO(item.created_at);
          return {
            ...item,
            // Extract just the day and month for the X-axis (e.g. "22.02.")
            formattedDate: format(date, 'dd.MM.', { locale: de }),
            // Keeping original string for deeper tooltip details
            fullDate: format(date, 'dd.MM.yyyy HH:mm', { locale: de }),
          };
        })
    );
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className='h-[200px] w-full flex items-center justify-center rounded-lg bg-card/50 border border-dashed text-muted-foreground text-sm'>
        Noch keine Temperaturdaten für dieses Zeitfenster verfügbar.
      </div>
    );
  }

  // Calculate dynamic gradient stops based on min/max temp
  const minTemp = Math.min(...chartData.map((d) => d.temperature), 10); // Floor around 10C
  const maxTemp = Math.max(...chartData.map((d) => d.temperature), 70); // Ceil around 70C

  // Create offsets for 60 degrees (Red) and 20 degrees (Blue)
  // Recharts gradient offsets go from 0% (top) to 100% (bottom)
  const range = maxTemp - minTemp;
  const gradientOffset = (val: number) => {
    if (range === 0) return 0.5; // Avoid divide by zero
    const percentage = (val - minTemp) / range;
    return Math.max(0, Math.min(1, 1 - percentage)); // Invert so 100% is bottom
  };

  const offset60 = `${gradientOffset(60) * 100}%`;
  const offset40 = `${gradientOffset(40) * 100}%`;
  const offset20 = `${gradientOffset(20) * 100}%`;

  return (
    <div className='h-[140px] w-full mt-1 -ml-4'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id='colorTemp' x1='0' y1='0' x2='0' y2='1'>
              <stop offset={offset60} stopColor='#ef4444' stopOpacity={1} />
              <stop offset={offset40} stopColor='#eab308' stopOpacity={1} />
              <stop offset={offset20} stopColor='#3b82f6' stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            vertical={false}
            strokeOpacity={0.15}
          />
          <XAxis
            dataKey='formattedDate'
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            domain={[
              Math.floor(minTemp / 10) * 10,
              Math.ceil(maxTemp / 10) * 10,
            ]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(val) => `${val}°`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{
              stroke: 'hsl(var(--muted-foreground))',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className='bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-sm'>
                    <p className='font-medium text-muted-foreground mb-1'>
                      {data.fullDate}
                    </p>
                    <p className='text-foreground flex items-center gap-2'>
                      <span
                        className='h-3 w-3 rounded-full'
                        style={{ background: payload[0].color }}
                      />
                      <span className='font-bold text-base'>
                        {data.temperature}°C
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type='monotone'
            dataKey='temperature'
            stroke='url(#colorTemp)'
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: 'url(#colorTemp)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
