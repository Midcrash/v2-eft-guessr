import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './MapSelector.css';

const maps = [
    {
        id: 'customs',
        name: 'Customs',
        thumbnail: '/maps/customs-2d_thumb.jpg',
    },
    {
        id: 'woods',
        name: 'Woods',
        thumbnail: '/maps/woods-2d_thumb.jpg',
    },
    {
        id: 'factory',
        name: 'Factory',
        thumbnail: '/maps/factory-2d_thumb.jpg',
    },
    {
        id: 'interchange',
        name: 'Interchange',
        thumbnail: '/maps/interchange-2d_thumb.jpg',
    },
    {
        id: 'shoreline',
        name: 'Shoreline',
        thumbnail: '/maps/shoreline-2d_thumb.jpg',
    },
    {
        id: 'reserve',
        name: 'Reserve',
        thumbnail: '/maps/reserve-2d_thumb.jpg',
    },
    {
        id: 'labs',
        name: 'The Lab',
        thumbnail: '/maps/labs-2d_thumb.jpg',
    },
    {
        id: 'lighthouse',
        name: 'Lighthouse',
        thumbnail: '/maps/lighthouse-2d_thumb.jpg',
    },
    {
        id: 'streets-of-tarkov',
        name: 'Streets of Tarkov',
        thumbnail: '/maps/streets-2d_thumb.jpg',
    },
    {
        id: 'ground-zero',
        name: 'Ground Zero',
        thumbnail: '/maps/ground-zero-2d_thumb.jpg',
    },
];

const MapSelector = () => {
    return (
        <div className="map-selector-container">
            <Helmet>
                <title>Escape from Tarkov Maps</title>
                <meta
                    name="description"
                    content="Interactive maps for Escape from Tarkov with coordinates"
                />
            </Helmet>

            <h1 className="map-selector-title">Select a Map</h1>

            <div className="map-grid">
                {maps.map((map) => (
                    <Link to={`/game/${map.id}`} key={map.id} className="map-item">
                        <div className="map-card">
                            <img
                                src={`${process.env.PUBLIC_URL}${map.thumbnail}`}
                                alt={`${map.name} Map`}
                                className="map-thumbnail"
                            />
                            <div className="map-name">{map.name}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default MapSelector;
