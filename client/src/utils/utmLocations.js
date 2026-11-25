export const UTM_CENTER = { lat: 1.5594, lng: 103.6378 };

export const UTM_CAMPUS_SPOTS = [
    {
        shortName: 'PSZ Library',
        label: 'UTM Library (PSZ - Level 1 Entrance)',
        location: 'UTM Perpustakaan Sultanah Zanariah (PSZ)',
        lat: 1.5597,
        lng: 103.6375,
    },
    {
        shortName: 'Arked Meranti',
        label: 'Arked Meranti (Courtyard)',
        location: 'Arked Meranti, UTM',
        lat: 1.5584,
        lng: 103.6392,
    },
    {
        shortName: 'Arked Cengal',
        label: 'Arked Cengal (Student Mall Cafe Area)',
        location: 'Arked Cengal, UTM',
        lat: 1.5612,
        lng: 103.6368,
    },
    {
        shortName: 'Computing (N28)',
        label: 'Faculty of Computing (FC Foyer / N28)',
        location: 'Faculty of Computing (N28), UTM',
        lat: 1.5641,
        lng: 103.6381,
    },
    {
        shortName: 'FABU (B12)',
        label: 'Faculty of Built Environment (FABU)',
        location: 'FABU / B12 Foyer, UTM',
        lat: 1.5582,
        lng: 103.6352,
    },
    {
        shortName: 'FKE (P19)',
        label: 'Faculty of Electrical Engineering (FKE)',
        location: 'FKE / P19 Entrance, UTM',
        lat: 1.5571,
        lng: 103.6406,
    },
    {
        shortName: 'KRP',
        label: 'Kolej Rahman Putra (KRP Cafeteria)',
        location: 'Kolej Rahman Putra (KRP), UTM',
        lat: 1.5635,
        lng: 103.6339,
    },
    {
        shortName: 'KTDI',
        label: 'Kolej Tun Dr. Ismail (KTDI Gazebo)',
        location: 'Kolej Tun Dr. Ismail (KTDI), UTM',
        lat: 1.5621,
        lng: 103.6432,
    },
    {
        shortName: 'KTF',
        label: 'Kolej Tun Fatimah (KTF Admin Area)',
        location: 'Kolej Tun Fatimah (KTF), UTM',
        lat: 1.5608,
        lng: 103.6318,
    },
    {
        shortName: 'KTHO',
        label: 'Kolej Tun Hussein Onn (KTHO)',
        location: 'Kolej Tun Hussein Onn (KTHO), UTM',
        lat: 1.5665,
        lng: 103.6332,
    },
];

export function resolveLocationCoords(locationName, coordinates) {
    if (
        coordinates &&
        Number.isFinite(Number(coordinates.lat)) &&
        Number.isFinite(Number(coordinates.lng))
    ) {
        return { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
    }

    if (locationName) {
        const lower = locationName.toLowerCase();
        const match = UTM_CAMPUS_SPOTS.find(
            (spot) =>
                lower.includes(spot.shortName.toLowerCase()) ||
                lower.includes(spot.location.toLowerCase())
        );
        if (match) {
            return { lat: match.lat, lng: match.lng };
        }
    }

    return UTM_CENTER;
}
