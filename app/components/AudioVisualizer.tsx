"use client";

import { useEffect, useRef } from "react";
import { AudioVisualizerData } from "../hooks/useAudioProcessing";

interface AudioVisualizerProps {
  visualizerData: AudioVisualizerData;
}

export const AudioVisualizer = ({ visualizerData }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!visualizerData.analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = visualizerData.analyser;
    
    // Initialize data array
    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const draw = () => {
      if (!analyser || !dataArrayRef.current || !ctx) return;

      analyser.getByteFrequencyData(dataArrayRef.current as any);
      
      // Use canvas background - better contrast for dark mode
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        barHeight = (dataArrayRef.current[i] / 255) * canvas.height * 0.8;
        
        // Create gradient effect based on bar height/level
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        
        // Color based on amplitude level - red at top, yellow in middle
        const amplitudeRatio = dataArrayRef.current[i] / 255;
        
        if (amplitudeRatio > 0.7) {
          // High level - red colors
          gradient.addColorStop(0, "#ef4444"); // Red at top
          gradient.addColorStop(1, "#dc2626"); // Darker red at bottom
        } else if (amplitudeRatio > 0.3) {
          // Medium level - yellow colors
          gradient.addColorStop(0, "#eab308"); // Yellow at top
          gradient.addColorStop(1, "#ca8a04"); // Darker yellow at bottom
        } else {
          // Low level - green colors
          gradient.addColorStop(0, "#22c55e"); // Green at top
          gradient.addColorStop(1, "#16a34a"); // Darker green at bottom
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Set up canvas
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start the visualization loop
    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [visualizerData.analyser]);

  if (!visualizerData.analyser) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Audio Spectrum Analyzer</h3>
      <div className="bg-gray-900 dark:bg-black rounded-lg p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-32"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
        🟢 Low level 🟡 Medium level 🟥 High level
      </p>
    </div>
  );
};
