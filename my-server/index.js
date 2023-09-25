const { Server } = require("socket.io");
const http = require("http");
const { spawn } = require("child_process");
// const axios = require("axios"); // Import Axios for making HTTP requests

const server = http.createServer();
const io = new Server(server, {
  cors: true,
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("track", (track) => {
    console.log("Received track from client:", track);
  });

  socket.on("offer", (offer) => {
    console.log("Received offer from client", offer);
  });

  socket.on("start-streaming", ({ platforms, streamKeys }) => {
    console.log("Starting the streaming process...");

    // Iterate through the selected platforms and start streaming to each
    for (const platform of platforms) {
      const streamKey = streamKeys[platform]; // Get the stream key for the platform

      if (streamKey) {
        startStreaming(platform, streamKey);
      } else {
        console.error(`Stream key not found for ${platform}`);
      }
    }
  });

  const startStreaming = async (platform, streamKey) => {
    try {
      // Modify your FFmpeg command based on the platform's requirements
      let ffmpegCommand;
      switch (platform) {
        case "youtube":
          ffmpegCommand = spawn("ffmpeg", [
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
            `rtmp://a.rtmp.youtube.com/live2/${streamKey}`,
          ]);
          break;
        case "facebook":
          // Modify the FFmpeg command for Facebook Live
          // (Refer to Facebook Live's streaming settings)
          ffmpegCommand = spawn("ffmpeg", [
            "-f", "v4l2",
            "-i", "/dev/video0",
            "-f", "alsa",
            "-i", "hw:0",
            "-c:v", "libx264",
            // Add Facebook-specific settings here
            // Example:
            "-preset", "veryfast",
            "-maxrate", "3000k",
            "-bufsize", "6000k",
            "-pix_fmt", "yuv420p",
            "-g", "60",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-f", "flv",
            // Replace with Facebook stream URL and stream key
            `rtmps://live-api-s.facebook.com:443/rtmp/${streamKey}`,
          ]);
          break;
        case "instagram":
          // Modify the FFmpeg command for Instagram Live
          // (Refer to Instagram Live's streaming settings)
          ffmpegCommand = spawn("ffmpeg", [
            "-f", "v4l2",
            "-i", "/dev/video0",
            "-f", "alsa",
            "-i", "hw:0",
            // Add Instagram-specific settings here
            // Example:
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
            // Replace with Instagram stream URL and stream key
            `rtmps://live-upload.instagram.com:443/rtmp/${streamKey}`,
          ]);
          break;
        default:
          console.error(`Unsupported platform: ${platform}`);
          return;
      }

      // Handle FFmpeg process events
      ffmpegCommand.stdout.on("data", (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });

      ffmpegCommand.stderr.on("data", (data) => {
        console.error(`FFmpeg stderr: ${data}`);
      });

      ffmpegCommand.on("close", (code) => {
        console.log(`FFmpeg process for ${platform} exited with code ${code}`);
      });
    } catch (error) {
      console.error(`Error starting streaming for ${platform}:`, error);
    }
  };
});

server.listen(8000, () => {
  console.log("Server is running on port 8000");
});
