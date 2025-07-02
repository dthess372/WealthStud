import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import './DynamicChart.css';

const DynamicChart = ({ data, lines, title, tooltipContent }) => {
  const [startYear, setStartYear] = useState(Math.min(...data.map(d => d.year)));
  const [endYear, setEndYear] = useState(Math.max(...data.map(d => d.year)));
  const [visibleLines, setVisibleLines] = useState(lines.reduce((acc, line) => ({ ...acc, [line.dataKey]: true }), {}));

  useEffect(() => {
    if (data && data.length > 0) {
      setStartYear(Math.min(...data.map(d => d.year)));
      setEndYear(Math.max(...data.map(d => d.year)));
    }
  }, [data]);

  const formatYAxisTick = (tick) => `${tick.toLocaleString()}`;

  const handleSliderChange = (values) => {
    setStartYear(values[0]);
    setEndYear(values[1]);
  };

  const toggleLineVisibility = (key) => {
    setVisibleLines(prevLines => ({ ...prevLines, [key]: !prevLines[key] }));
  };

  const filteredData = data.filter(d => d.year >= startYear && d.year <= endYear);

  return (
    <div className='chartHolder'>
      <ResponsiveContainer className="ResponsiveContainer" width="90%" height="90%">
        <LineChart
          className='chart'
          data={filteredData}
          margin={{ top: 50, left: 50, right: 25, bottom: 75 }}
        >
          <text x="50%" y={40} textAnchor="middle" fill="#fff" fontSize="32px">{title}</text>
          <CartesianGrid stroke="#444444" />
          <XAxis dataKey='year' stroke='#ffffff' dy={10} />
          <YAxis stroke='#cccccc' dx={-5} allowDecimals={false} tickFormatter={formatYAxisTick} />
          <Tooltip content={tooltipContent} />
          <Legend verticalAlign="top" height={36} iconType='line' onClick={(e) => toggleLineVisibility(e.dataKey)} />
          {lines.map(line => visibleLines[line.dataKey] && (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={3}
              name={line.name}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
        <div className="slider">
          <Slider
            min={Math.min(...data.map(d => d.year))}
            max={Math.max(...data.map(d => d.year))}
            value={[startYear, endYear]}
            onChange={handleSliderChange}
            range
          />
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default DynamicChart;
