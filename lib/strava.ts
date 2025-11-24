import axios from 'axios';

export interface StravaActivity {
    id: number;
    name: string;
    map: {
        summary_polyline: string;
    };
    start_latlng: [number, number];
    type: string;
    distance: number;
    moving_time: number;
    start_date: string;
}

export async function getStravaActivities(accessToken: string): Promise<StravaActivity[]> {
    try {
        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                per_page: 200, // Get last 200 activities
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching Strava activities:', error);
        return [];
    }
}
