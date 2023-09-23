const { Server } = require("socket.io");
const http = require("http");
const { spawn } = require("child_process"); // Import the 'spawn' function from the 'child_process' module.

const server = http.createServer();
const io = new Server(server, {
  cors: true,
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // Listen for incoming tracks from the client and process them
  socket.on("track", (track) => {
    console.log("Received track from client:", track);
  });

  socket.on("offer", (offer) => {
    console.log("Received offer from client", offer);

    // You can process the offer or relay it to other clients if needed
    // In this example, we simply respond with an answer
    // socket.emit('answer', offer);
  });

  // Start the FFmpeg streaming when a specific event is triggered, e.g., "start-streaming"
  socket.on("start-streaming", (streamKey) => {
    console.log("Starting the streaming process with stream key:", streamKey);
  
    // Use the received stream key in your FFmpeg command
    const STREAM_KEY = streamKey; 

    // Define the FFmpeg command to capture video and audio and stream to YouTube
    const ffmpegCommand = spawn("ffmpeg", [
      "-f", "v4l2",
      "-i", "/dev/video0",
      "-f", "alsa",
      "-i", "hw:0",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-maxrate", "3000k",
      "-bufsize", "6000k",
      "-pix_fmt", "yuv420p",
      "-g", "60",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ar", "44100",
      "-f", "flv",
      `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`,
    ]);

    // Handle FFmpeg process events
    ffmpegCommand.stdout.on("data", (data) => {
      console.log(`FFmpeg stdout: ${data}`);
    });

    ffmpegCommand.stderr.on("data", (data) => {
      console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegCommand.on("close", (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
    });
  });
});

server.listen(8000, () => {
  console.log("Server is running on port 8000");
});
