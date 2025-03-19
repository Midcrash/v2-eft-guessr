import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import TarkovMap from './TarkovMap';

// Map configuration for display names
const mapNames = {
    customs: 'Customs',
    woods: 'Woods',
    factory: 'Factory',
    interchange: 'Interchange',
    shoreline: 'Shoreline',
    reserve: 'Reserve',
    labs: 'The Lab',
    lighthouse: 'Lighthouse',
    'streets-of-tarkov': 'Streets of Tarkov',
    'ground-zero': 'Ground Zero',
};

const TarkovMapPage = () => {
    const { mapName } = useParams();
    const displayName = mapNames[mapName] || 'Unknown Map';

    // Hide menu and footer for fullscreen experience
    useEffect(() => {
        // Add a class to hide menu
        document.body.classList.add('fullscreen-map');

        // Clean up on unmount
        return () => {
            document.body.classList.remove('fullscreen-map');
        };
    }, []);

    return (
        <>
            <Helmet>
                <title>{displayName} Map - Escape from Tarkov</title>
                <meta
                    name="description"
                    content={`Interactive ${displayName} map for Escape from Tarkov with coordinates`}
                />
            </Helmet>
            <div className="page-container fullscreen-map">
                <TarkovMap />
            </div>
        </>
    );
};

export default TarkovMapPage;
