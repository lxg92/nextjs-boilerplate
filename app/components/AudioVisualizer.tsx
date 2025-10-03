"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  audioUrl: string | null;
}

export const AudioVisualizer = ({ audioUrl }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let isInitialized = false;

    const initAudioContext = async () => {
      if (isInitialized) return;
      
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      isInitialized = true;
    };

    const draw = () => {
      if (!analyser || !dataArray || !ctx) return;

      analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
      
      // Use canvas background - better contrast for dark mode
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // Create gradient effect
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        
        // Color based on frequency bands - improved contrast
        if (i < dataArray.length * 0.3) {
          // Low frequencies - bright blues for better contrast
          gradient.addColorStop(0, "#60a5fa");
          gradient.addColorStop(1, "#3b82f6");
        } else if (i < dataArray.length * 0.7) {
          // Mid frequencies - bright greens
          gradient.addColorStop(0, "#34d399");
          gradient.addColorStop(1, "#10b981");
        } else {
          // High frequencies - bright reds
          gradient.addColorStop(0, "#f87171");
          gradient.addColorStop(1, "#ef4444");
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    const handlePlay = async () => {
      if (!isInitialized) {
        await initAudioContext();
      }
      if (audioContext?.state === "suspended") {
        await audioContext.resume();
      }
      draw();
    };

    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    // Set up canvas
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Audio event listeners
    audio.addEventListener("loadedmetadata", initAudioContext);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
      audio.removeEventListener("loadedmetadata", initAudioContext);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
    };
  }, [audioUrl]);

  if (!audioUrl) {
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
        🟦 Low frequencies 🟩 Mid frequencies 🟥 High frequencies
      </p>
    </div>
  );
};
