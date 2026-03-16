import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

export interface ChartData {
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: { [key: string]: any }[];
  xAxisKey: string;
  dataKeys: string[];
}

interface ChatChartProps {
  data: ChartData;
  isDark: boolean;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ChatChart({ data, isDark }: ChatChartProps) {
  const { title, type, data: chartData, xAxisKey, dataKeys } = data;

  const textColor = isDark ? '#cbd5e1' : '#475569';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey={xAxisKey} stroke={textColor} tick={{ fill: textColor, fontSize: 12 }} />
              <YAxis stroke={textColor} tick={{ fill: textColor, fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }} 
                itemStyle={{ color: textColor }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {dataKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey={xAxisKey} stroke={textColor} tick={{ fill: textColor, fontSize: 12 }} />
              <YAxis stroke={textColor} tick={{ fill: textColor, fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }} 
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {dataKeys.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie': {
        // For pie chart, usually there's one main dataKey to display values
        const primaryDataKey = dataKeys[0];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey={primaryDataKey}
                nameKey={xAxisKey}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      default:
        return <div className="p-4 text-center text-red-500">Unsupported chart type</div>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden shadow-sm my-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
    >
      <div className={`px-5 py-3 border-b ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-50 bg-slate-50'}`}>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {title}
        </h3>
      </div>
      <div className="p-4">
        {renderChart()}
      </div>
    </motion.div>
  );
}
