document.addEventListener('DOMContentLoaded', () => {
    class MapManager {
        constructor() {
            this.map = null;
            this.dataLayer = null;
            this.geojsonData = window.geojsonData || { features: [] };
            this.selectedCategory = 'all';
            this.defaultCenter = [9.0820, 8.6753]; // Nigeria center
            this.defaultZoom = 6;

            this.styles = {
                publication: { color: '#ff7800', label: 'Publication' },
                event: { color: '#00ff00', label: 'Event' },
                vendor: { color: '#0000ff', label: 'Vendor' },
                service: { color: '#ff00ff', label: 'Service' },
                waste: { color: '#800080', label: 'Waste' },
                trending: { color: '#ff0000', label: 'Trending' },
            };
        }

        initializeMap() {
            console.log('Initializing map...');
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                this.showError('Map container not found.');
                return false;
            }
            try {
                this.map = L.map('map', {
                    center: this.defaultCenter,
                    zoom: this.defaultZoom,
                    zoomControl: true,
                });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 18,
                }).addTo(this.map);
                console.log('Map initialized');
                return true;
            } catch (error) {
                this.showError('Failed to initialize map.');
                console.error('Map init error:', error);
                return false;
            }
        }

        loadGeoJson() {
            console.log('Loading GeoJSON...');
            if (!this.geojsonData.features.length) {
                this.showError('No GeoJSON data loaded. Check data/lomap.js.');
                console.error('GeoJSON missing:', this.geojsonData);
                return;
            }
            try {
                this.dataLayer = L.geoJSON(this.geojsonData, {
                    pointToLayer: (feature, latlng) => {
                        const category = feature.properties?.category || 'publication';
                        const [lon, lat] = feature.geometry.coordinates;
                        if (isNaN(lat) || isNaN(lon)) {
                            console.warn(`Invalid coordinates for: ${feature.properties?.title || 'Unnamed'}`);
                            return null;
                        }
                        return L.circleMarker(latlng, {
                            radius: 8,
                            fillColor: this.styles[category]?.color || '#ff7800',
                            color: '#000',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8,
                        });
                    },
                    filter: (feature) => {
                        return feature.geometry?.coordinates?.length === 2 &&
                               !isNaN(feature.geometry.coordinates[0]) &&
                               !isNaN(feature.geometry.coordinates[1]);
                    },
                    onEachFeature: (feature, layer) => {
                        if (layer) {
                            const category = feature.properties?.category || 'unknown';
                            layer.bindPopup(`
                                <strong>${feature.properties.title || 'Untitled'}</strong><br>
                                ${feature.properties.description || 'No description'}<br>
                                Category: ${this.styles[category]?.label || 'Unknown'}<br>
                                ${feature.properties.link ? `<a href="${feature.properties.link}" target="_blank" rel="noopener">Link</a>` : ''}
                                ${feature.properties.date ? `<br>Date: ${feature.properties.date}` : ''}
                            `);
                        }
                    },
                });
                this.filterLayer();
                this.map.addLayer(this.dataLayer);
                const bounds = this.dataLayer.getBounds();
                if (bounds.isValid()) {
                    this.map.fitBounds(bounds);
                }
                console.log('GeoJSON loaded:', this.geojsonData.features.length, 'features');
            } catch (error) {
                this.showError('Failed to load map data.');
                console.error('GeoJSON load error:', error);
            }
        }

        filterLayer() {
            console.log('Filtering layer:', this.selectedCategory);
            this.dataLayer.eachLayer(layer => {
                const category = layer.feature.properties?.category || 'publication';
                layer.setStyle({
                    fillOpacity: (this.selectedCategory === 'all' || category === this.selectedCategory) ? 0.8 : 0,
                    opacity: (this.selectedCategory === 'all' || category === this.selectedCategory) ? 1 : 0,
                });
            });
        }

        initializeInteractions() {
            console.log('Initializing interactions...');
            const toggleSidebar = document.getElementById('toggleSidebar');
            const sidebarContent = document.getElementById('sidebarContent');
            const categoryFilter = document.getElementById('categoryFilter');
            const themeSelect = document.getElementById('themeSelect');

            if (!toggleSidebar || !sidebarContent || !categoryFilter || !themeSelect) {
                this.showError('Failed to initialize controls.');
                console.error('Missing DOM elements:', { toggleSidebar, sidebarContent, categoryFilter, themeSelect });
                return;
            }

            // Bootstrap collapse toggle
            toggleSidebar.addEventListener('click', () => {
                const bsCollapse = new bootstrap.Collapse(sidebarContent, { toggle: true });
                const isVisible = sidebarContent.classList.contains('show');
                toggleSidebar.setAttribute('aria-expanded', isVisible);
                console.log('Sidebar toggled:', isVisible ? 'visible' : 'hidden');
            });

            categoryFilter.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value;
                console.log('Category selected:', this.selectedCategory);
                this.filterLayer();
            });

            themeSelect.addEventListener('change', (e) => {
                document.body.className = `${e.target.value}-theme`;
                console.log('Theme changed to:', e.target.value);
            });
        }

        showError(message) {
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }

        start() {
            console.log('Starting MapManager...');
            if (this.initializeMap()) {
                this.loadGeoJson();
                this.initializeInteractions();
                console.log('MapManager started successfully');
            }
        }
    }

    const mapManager = new MapManager();
    mapManager.start();
});