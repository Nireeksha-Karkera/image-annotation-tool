import React, { useState, useRef, useEffect } from 'react';
import './App.css'; 

function App() {
  const [imageSrc, setImageSrc] = useState(null); // Image source
  const [annotations, setAnnotations] = useState([]); // Bounding boxes list
  const [currentLabel, setCurrentLabel] = useState('b'); // Selected label
  const [isDrawing, setIsDrawing] = useState(false); // Track drawing state
  const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // Start position
  const [currentBox, setCurrentBox] = useState(null); // Current bounding box
  const canvasRef = useRef(null); // Canvas ref for drawing
  const [undoStack, setUndoStack] = useState([]); // Undo history
  const [redoStack, setRedoStack] = useState([]); // Redo history

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle mouse down (start drawing a box)
  const handleMouseDown = (e) => {
    if (!imageSrc) return; // No image, no drawing
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    setStartPos({ x: offsetX, y: offsetY });
  };

  // Handle mouse move (resize the box)
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const newBox = {
      x: startPos.x,
      y: startPos.y,
      width: offsetX - startPos.x,
      height: offsetY - startPos.y,
      label: currentLabel,
    };
    setCurrentBox(newBox);
  };

  // Handle mouse up (finish drawing)
  const handleMouseUp = () => {
    if (isDrawing && currentBox) {
      setAnnotations((prev) => {
        const newAnnotations = [...prev, currentBox];
        setUndoStack([...undoStack, prev]); // Push current state to undo stack
        setRedoStack([]); // Clear redo stack when a new action is taken
        return newAnnotations;
      });
      setCurrentBox(null);
    }
    setIsDrawing(false);
  };

  // Handle label change
  const handleLabelChange = (e) => {
    setCurrentLabel(e.target.value);
  };

  // Handle download of annotations in JSON format
  const handleDownload = () => {
    const annotationData = {
      filename: 'annotated_image.jpg',
      annotations,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(annotationData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'annotations.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle undo action
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack.pop(); // Get the last state
      setRedoStack([annotations, ...redoStack]); // Push current state to redo stack
      setAnnotations(lastState); // Restore the last state
      setUndoStack(undoStack); // Update the undo stack
    }
  };

  // Handle redo action
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.shift(); // Get the next state
      setUndoStack([...undoStack, annotations]); // Push current state to undo stack
      setAnnotations(nextState); // Restore the next state
      setRedoStack(redoStack); // Update the redo stack
    }
  };

  // Keyboard shortcuts for labels
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case '1':
          setCurrentLabel('b'); // Button
          break;
        case '2':
          setCurrentLabel('i'); // Input
          break;
        case '3':
          setCurrentLabel('s'); // Select
          break;
        case '4':
          setCurrentLabel('t'); // Text
          break;
        case '5':
          setCurrentLabel('img'); // Image
          break;
        case '6':
          setCurrentLabel('l'); // Link
          break;
        case 'z':
          if (e.ctrlKey) handleUndo(); // Ctrl+Z for undo
          break;
        case 'y':
          if (e.ctrlKey) handleRedo(); // Ctrl+Y for redo
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoStack, redoStack, annotations]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 h-screen">
      <h1 className="text-2xl font-bold mb-4">Image Annotation Tool</h1>

      {/* Image Upload */}
      <div className="flex mb-4 items-center">
        <input
          type="file"
          onChange={handleImageUpload}
          className="mr-4 p-2 border rounded"
        />
        <select
          value={currentLabel}
          onChange={handleLabelChange}
          className="p-2 border rounded"
        >
          <option value="b">Button</option>
          <option value="i">Input</option>
          <option value="s">Select</option>
          <option value="t">Text</option>
          <option value="img">Image</option>
          <option value="l">Link</option>
          <option value="li">List</option>
          <option value="active-i">Active Input</option>
          <option value="active-s">Active Select</option>
        </select>
        <button
          onClick={handleDownload}
          className="ml-4 p-2 bg-blue-500 text-white rounded"
        >
          Download Annotations
        </button>
        <button
          onClick={handleUndo}
          className="ml-4 p-2 bg-yellow-500 text-white rounded"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          className="ml-4 p-2 bg-green-500 text-white rounded"
        >
          Redo
        </button>
      </div>

      {/* Image Workspace */}
      <div
        ref={canvasRef}
        className="relative w-full max-w-4xl h-96 bg-white border"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Annotation workspace"
            className="absolute w-full h-full object-contain"
          />
        )}

        {/* Render annotations */}
        {annotations.map((box, index) => (
          <div
            key={index}
            className={`absolute border-2 ${getColorForLabel(box.label)}`}
            style={{
              left: `${box.x}px`,
              top: `${box.y}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
          >
            <div className="bg-black text-white text-xs px-1">{box.label}</div>
          </div>
        ))}

        {/* Render current drawing box */}
        {isDrawing && currentBox && (
          <div
            className="absolute border-2 border-blue-500"
            style={{
              left: `${currentBox.x}px`,
              top: `${currentBox.y}px`,
              width: `${currentBox.width}px`,
              height: `${currentBox.height}px`,
            }}
          >
            <div className="bg-blue-500 text-white text-xs px-1">
              {currentLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function to get color for each label
const getColorForLabel = (label) => {
  switch (label) {
    case 'b':
      return 'border-red-500';
    case 'i':
      return 'border-green-500';
    case 's':
      return 'border-yellow-500';
    case 't':
      return 'border-blue-500';
    case 'img':
      return 'border-purple-500';
    case 'l':
      return 'border-pink-500';
    default:
      return 'border-gray-500';
  }
};

export default App;
