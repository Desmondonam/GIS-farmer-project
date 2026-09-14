import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingState } from './components/States';
import Overview from './pages/Overview';

// MapLibre GL pulls in a large bundle (~1MB) — keep it out of the initial
// load and only fetch it when someone actually opens the map route.
const Fleet = lazy(() => import('./pages/Fleet'));
const FarmsMap = lazy(() => import('./pages/FarmsMap'));
const Demand = lazy(() => import('./pages/Demand'));
const Revenue = lazy(() => import('./pages/Revenue'));
const Vegetation = lazy(() => import('./pages/Vegetation'));
const DataQuality = lazy(() => import('./pages/DataQuality'));
const Recommendations = lazy(() => import('./pages/Recommendations'));

export default function App() {
  return (
    <Suspense fallback={<LoadingState label="Loading page…" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="map" element={<FarmsMap />} />
          <Route path="demand" element={<Demand />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="vegetation" element={<Vegetation />} />
          <Route path="data-quality" element={<DataQuality />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
