// utils/screenCapture.ts

/**
 * Captures a screenshot of the user's screen using the browser's Screen Capture API.
 * Returns the screenshot as a base64 encoded string (data URL).
 */
export async function captureScreen(): Promise<string> {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                // Requesting a single frame effectively, but we need a stream first
                width: { ideal: 1920 },
                height: { ideal: 1080 },
            },
            audio: false,
        });

        const video = document.createElement('video');
        video.srcObject = stream;

        // Wait for the video to load metadata and play
        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        // Wait a brief moment for the video to actually render a frame
        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Stop all tracks to release the screen capture
        stream.getTracks().forEach((track) => track.stop());

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl;
    } catch (error) {
        console.error('Error capturing screen:', error);
        throw error;
    }
}
