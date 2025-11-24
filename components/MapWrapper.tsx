'use client';

import dynamic from 'next/dynamic';
import { StravaActivity } from '@/lib/strava';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Loading Map...</div>
});

interface MapWrapperProps {
    activities: StravaActivity[];
}

export default function MapWrapper({ activities }: MapWrapperProps) {
    return <Map activities={activities} />;
}
