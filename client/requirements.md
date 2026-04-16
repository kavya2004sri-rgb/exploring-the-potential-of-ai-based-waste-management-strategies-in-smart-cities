## Packages
react-leaflet | For interactive maps showing listing locations
leaflet | Core mapping library
recharts | For visualizing waste reduction metrics on the dashboard
framer-motion | For smooth page transitions and micro-interactions
react-dropzone | For drag-and-drop image uploads
clsx | For conditional class merging
tailwind-merge | For handling Tailwind class conflicts

## Notes
The app uses react-leaflet for maps. Leaflet CSS must be imported in index.css or App.tsx.
Image uploads are handled as base64 strings sent to the backend.
AI waste identification endpoint expects a base64 string image.
