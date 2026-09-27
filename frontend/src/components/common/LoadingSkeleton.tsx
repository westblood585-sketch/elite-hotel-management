import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                             <div className="space-y-2">
                                 <Skeleton className="h-4 w-24" />
                                 <Skeleton className="h-8 w-32" />
                             </div>
                             <Skeleton className="h-10 w-10 rounded-full" />
                         </div>
                         <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="space-y-2">
                             <Skeleton className="h-3 w-20" />
                             <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-lg" />
                     </div>
                 ))}
             </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[400px]">
                    <Skeleton className="h-6 w-48 mb-6" />
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[400px]">
                     <Skeleton className="h-6 w-32 mb-6" />
                     <Skeleton className="h-[200px] w-full rounded-full mx-auto my-8" />
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                     </div>
                </div>
            </div>
        </div>
    )
}

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                 <Skeleton className="h-6 w-32" />
                 <div className="flex gap-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-9 w-24" />
                 </div>
             </div>
             <div className="p-4">
                 <div className="space-y-4">
                     {/* Header */}
                     <div className="flex gap-4 mb-4">
                         {[1, 2, 3, 4, 5].map(i => (
                             <Skeleton key={i} className="h-4 w-full" />
                         ))}
                     </div>
                     {/* Rows */}
                     {Array.from({ length: rows }).map((_, i) => (
                         <div key={i} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                              {[1, 2, 3, 4, 5].map(j => (
                                 <Skeleton key={j} className="h-8 w-full" />
                             ))}
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    )
}

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-pulse">
        {/* Header */}
        <Skeleton className="h-8 w-1/3 mb-8" />
        
        <div className="flex flex-col md:flex-row gap-8">
            {/* Left Col - Image/Main */}
            <div className="w-full md:w-1/2">
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            {/* Right Col - Details */}
            <div className="w-full md:w-1/2 space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-6 w-1/4 mb-4" />
                
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>

                <div className="pt-6 space-y-4">
                     <Skeleton className="h-12 w-full rounded-lg" />
                     <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        </div>
    </div>
  )
}

export default Skeleton;
