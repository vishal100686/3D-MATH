
import React, { useState, useCallback, useRef } from 'react';
import { Point3D, TriangleShape } from './types';
import { generateId } from './utils/math';
import PointInputForm from './components/PointInputForm';
import PointList from './components/PointList';
import DistanceDisplay from './components/DistanceDisplay';
import AngleDisplay from './components/AngleDisplay';
import Scene3D, { Scene3DHandle } from './components/Scene3D';

const App: React.FC = () => {
  const [points, setPoints] = useState<Point3D[]>([]);
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [editingPoint, setEditingPoint] = useState<Point3D | null>(null);
  const [triangles, setTriangles] = useState<TriangleShape[]>([]);
  const [isClickToAddEnabled, setIsClickToAddEnabled] = useState(true); // New state for toggle
  const sceneRef = useRef<Scene3DHandle>(null);

  const handleAddOrUpdatePoint = useCallback((point: Point3D) => {
    setPoints(prevPoints => {
      const index = prevPoints.findIndex(p => p.id === point.id);
      if (index !== -1) {
        const updatedPoints = [...prevPoints];
        updatedPoints[index] = point;
        return updatedPoints;
      } else {
        return [...prevPoints, point];
      }
    });
    setEditingPoint(null);
  }, []);

  const handleDeletePoint = useCallback((idToDelete: string) => {
    setPoints(prevPoints => prevPoints.filter(p => p.id !== idToDelete));
    setSelectedPointIds(prevIds => prevIds.filter(id => id !== idToDelete));
    setTriangles(prevTriangles => 
      prevTriangles.filter(triangle => !triangle.pointIds.includes(idToDelete))
    );
    if (editingPoint && editingPoint.id === idToDelete) {
      setEditingPoint(null);
    }
  }, [editingPoint]);

  const handleSelectPoint = useCallback((id: string) => {
    setSelectedPointIds(prevIds => {
      const newIds = [...prevIds];
      const index = newIds.indexOf(id);

      if (index !== -1) { 
        newIds.splice(index, 1);
      } else { 
        if (newIds.length < 3) {
          newIds.push(id);
        } else {
          newIds.shift(); 
          newIds.push(id);
        }
      }
      return newIds;
    });
     if (editingPoint) {
        setEditingPoint(null);
     }
  }, [editingPoint]);

  const handleEditPoint = useCallback((point: Point3D) => {
    setEditingPoint(point);
    setSelectedPointIds([]); 
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPoint(null);
  }, []);

  const handleAddPointFromScene = useCallback((coords: { x: number; y: number; z: number }) => {
    const existingPointAtCoords = points.find(p => 
        Math.abs(p.x - coords.x) < 0.01 && 
        Math.abs(p.y - coords.y) < 0.01 && 
        Math.abs(p.z - coords.z) < 0.01 
    );

    if (existingPointAtCoords) {
        handleSelectPoint(existingPointAtCoords.id);
        return;
    }

    const newPointName = `P${points.length + 1}`;
    const newPoint: Point3D = {
      id: generateId(),
      name: newPointName,
      ...coords,
    };
    handleAddOrUpdatePoint(newPoint);
    setSelectedPointIds(prev => {
        const newSelection = [...prev, newPoint.id];
        if (newSelection.length > 3) newSelection.shift();
        return newSelection;
    });

  }, [points, handleAddOrUpdatePoint, handleSelectPoint]);

  const handleDownloadScene = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.exportImage();
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.resetCamera();
    }
  }, []);

  const handleCreateTriangle = useCallback(() => {
    if (selectedPointIds.length === 3) {
      const p1 = points.find(p => p.id === selectedPointIds[0]);
      const p2 = points.find(p => p.id === selectedPointIds[1]);
      const p3 = points.find(p => p.id === selectedPointIds[2]);
      if (p1 && p2 && p3) {
        const triangleName = `Tri ${triangles.length + 1} (${p1.name}, ${p2.name}, ${p3.name})`;
        const newTriangle: TriangleShape = {
          id: generateId(),
          pointIds: [selectedPointIds[0], selectedPointIds[1], selectedPointIds[2]],
          name: triangleName,
        };
        setTriangles(prev => [...prev, newTriangle]);
        setSelectedPointIds([]); 
      }
    }
  }, [selectedPointIds, points, triangles]);

  const handleDeleteTriangle = useCallback((triangleId: string) => {
    setTriangles(prev => prev.filter(t => t.id !== triangleId));
  }, []);

  const toggleClickToAdd = useCallback(() => {
    setIsClickToAddEnabled(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-200 text-gray-800 antialiased">
      {/* Control Panel */}
      <div className="w-full md:w-[400px] lg:w-[450px] p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto bg-slate-50 shadow-xl flex flex-col">
        <h1 className="text-2xl lg:text-3xl font-bold text-indigo-700 mb-2 md:mb-4 text-center shrink-0">
          3D Point Modeler
        </h1>

        <div className="p-3 bg-gray-100 rounded-md shadow-sm shrink-0">
            <div className="flex items-center justify-between">
                <label htmlFor="clickToAddToggle" className="text-sm font-medium text-gray-700 select-none">
                    Enable Click-to-Add Points
                </label>
                <button
                    id="clickToAddToggle"
                    role="switch"
                    aria-checked={isClickToAddEnabled}
                    onClick={toggleClickToAdd}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isClickToAddEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                >
                    <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        isClickToAddEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                    />
                </button>
            </div>
        </div>
        
        <div className="shrink-0">
          <PointInputForm
            onSubmitPoint={handleAddOrUpdatePoint}
            editingPoint={editingPoint}
            onCancelEdit={handleCancelEdit}
          />
        </div>
        
        <div className="flex-grow-[0.5] overflow-y-auto min-h-[150px]">
          <PointList
            points={points}
            selectedPointIds={selectedPointIds}
            onSelectPoint={handleSelectPoint}
            onEditPoint={handleEditPoint}
            onDeletePoint={handleDeletePoint}
          />
        </div>
        
        {triangles.length > 0 && (
          <div className="p-4 bg-white shadow-md rounded-lg mb-6 flex-grow-[0.5] overflow-y-auto min-h-[100px]">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Triangles</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {triangles.map(triangle => (
                <li key={triangle.id} className="p-2 rounded-md bg-gray-50 flex justify-between items-center border border-gray-200">
                  <span className="text-sm text-gray-700">{triangle.name}</span>
                  <button
                    onClick={() => handleDeleteTriangle(triangle.id)}
                    className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 focus:outline-none"
                    aria-label={`Delete triangle ${triangle.name}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="shrink-0 space-y-3">
          {selectedPointIds.length === 2 && (
            <DistanceDisplay
              points={points}
              selectedPointIds={selectedPointIds}
            />
          )}
          {selectedPointIds.length === 3 && (
            <>
              <AngleDisplay
                points={points}
                selectedPointIds={selectedPointIds}
              />
              <button
                onClick={handleCreateTriangle}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Create Triangle from Selected Points
              </button>
            </>
          )}
          {(selectedPointIds.length < 2 || selectedPointIds.length > 3) && !editingPoint && triangles.length === 0 && (
              <div className="p-4 bg-white shadow-md rounded-lg text-center text-sm text-gray-500">
                  <p>Select 2 points for distance, or 3 for angle/triangle.</p>
                  <p className="mt-1">{isClickToAddEnabled ? "Click on the grid to add points." : "Enable 'Click-to-Add' to place points on grid."}</p>
              </div>
          )}
           {(selectedPointIds.length < 2 || selectedPointIds.length > 3) && !editingPoint && triangles.length > 0 && (
              <div className="p-4 bg-white shadow-md rounded-lg text-center text-sm text-gray-500">
                  <p>Select points for calculations or to form new shapes.</p>
                   <p className="mt-1">{isClickToAddEnabled ? "Click on the grid to add more points." : "Enable 'Click-to-Add' to place points on grid."}</p>
              </div>
          )}
        </div>

        <div className="pt-2 md:pt-4 space-y-2 shrink-0 mt-auto">
          <button
            onClick={handleResetView}
            aria-label="Reset camera view"
            className="w-full px-4 py-3 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-sky-500 transition-colors duration-150"
          >
            Reset View
          </button>
          <button
            onClick={handleDownloadScene}
            aria-label="Download scene as image"
            className="w-full px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-green-500 transition-colors duration-150"
          >
            Download Scene as Image
          </button>
        </div>
      </div>

      <div className="flex-grow h-1/2 md:h-full bg-gray-300 relative">
        <Scene3D
          ref={sceneRef}
          points={points}
          selectedPointIds={selectedPointIds}
          triangles={triangles}
          onSelectPointInScene={handleSelectPoint}
          onAddPoint={handleAddPointFromScene}
          isClickToAddEnabled={isClickToAddEnabled} 
        />
      </div>
    </div>
  );
};

export default App;
