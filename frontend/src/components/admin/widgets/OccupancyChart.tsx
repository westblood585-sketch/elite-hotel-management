import React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface OccupancyChartProps {
  data: {
    name: string
    value: number
    color: string
  }[]
}

const OccupancyChart = ({ data }: OccupancyChartProps) => {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="h-[350px] w-full bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
         <h3 className="text-lg font-bold text-gray-900">Occupancy Rate</h3>
         <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            {/* Can add interactions later */}
         </button>
      </div>

      <div className="h-[260px] w-full min-w-0 relative z-10">
        <div className="absolute inset-0 w-full h-full">
          {isMounted && (
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={8}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="drop-shadow-sm hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'rgba(255,255,255,0.9)' }}
                    itemStyle={{ fontWeight: 600 }}
                />
                <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default OccupancyChart
