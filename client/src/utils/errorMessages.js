/**
 * User-friendly error messages for common API errors
 */

export const getErrorMessage = (error) => {
  const detail = error.response?.data?.detail || error.message;
  const status = error.response?.status;

  // FFmpeg not installed
  if (detail?.includes('FFmpeg is required') || detail?.includes('FFmpeg not found')) {
    return {
      title: 'FFmpeg Not Installed',
      message: 'FFmpeg is required for video processing but is not installed on the server.',
      action: 'Please install FFmpeg on the server. See documentation for installation instructions.',
      docs: 'https://ffmpeg.org/download.html'
    };
  }

  // FFprobe not found
  if (detail?.includes('FFprobe')) {
    return {
      title: 'FFprobe Not Found',
      message: 'FFprobe (part of FFmpeg) is required but not found.',
      action: 'Install FFmpeg which includes FFprobe.',
      docs: 'https://ffmpeg.org/download.html'
    };
  }

  // Whisper not installed
  if (detail?.includes('Whisper') || detail?.includes('openai-whisper')) {
    return {
      title: 'Whisper Not Installed',
      message: 'Script extraction requires Whisper AI but it is not installed.',
      action: 'This is optional. Install with: pip install openai-whisper',
      docs: null
    };
  }

  // Project not found
  if (status === 404 && detail?.includes('Project not found')) {
    return {
      title: 'Project Not Found',
      message: 'The requested project does not exist or has been deleted.',
      action: 'Please upload a new video to create a project.',
      docs: null
    };
  }

  // Video file not found
  if (status === 404 && detail?.includes('Video file not found')) {
    return {
      title: 'Video File Missing',
      message: 'The video file for this project cannot be found.',
      action: 'Please upload the video again.',
      docs: null
    };
  }

  // Frames not found
  if (status === 404 && detail?.includes('Frames not found')) {
    return {
      title: 'Frames Not Extracted',
      message: 'Frames have not been extracted from the video yet.',
      action: 'Please extract frames first before rebuilding the video.',
      docs: null
    };
  }

  // Service unavailable (503)
  if (status === 503) {
    return {
      title: 'Service Unavailable',
      message: detail || 'The video processing service is temporarily unavailable.',
      action: 'Please check if FFmpeg is installed on the server.',
      docs: null
    };
  }

  // Invalid file type
  if (detail?.includes('Invalid file type')) {
    return {
      title: 'Invalid File Type',
      message: 'The uploaded file type is not supported.',
      action: 'Please upload a video file (MP4, AVI, MOV, MKV, or WEBM).',
      docs: null
    };
  }

  // File too large
  if (detail?.includes('too large') || detail?.includes('size')) {
    return {
      title: 'File Too Large',
      message: 'The uploaded file exceeds the maximum size limit.',
      action: 'Please upload a smaller video file (max 500MB).',
      docs: null
    };
  }

  // Generic 500 error
  if (status === 500) {
    return {
      title: 'Server Error',
      message: detail || 'An unexpected error occurred on the server.',
      action: 'Please check the server logs for more details. Make sure FFmpeg is installed.',
      docs: null
    };
  }

  // Network error
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return {
      title: 'Connection Error',
      message: 'Cannot connect to the server.',
      action: 'Please check if the FastAPI server is running on http://localhost:8000',
      docs: null
    };
  }

  // Default error
  return {
    title: 'Error',
    message: detail || 'An unexpected error occurred.',
    action: 'Please try again or contact support if the problem persists.',
    docs: null
  };
};

/**
 * Format error for toast notification
 */
export const formatErrorForToast = (error) => {
  const errorInfo = getErrorMessage(error);
  return `${errorInfo.title}: ${errorInfo.message}`;
};

/**
 * Check if error is due to missing FFmpeg
 */
export const isFFmpegError = (error) => {
  const detail = error.response?.data?.detail || error.message;
  return detail?.includes('FFmpeg') || detail?.includes('FFprobe');
};

/**
 * Check if error is due to missing optional dependency
 */
export const isOptionalDependencyError = (error) => {
  const detail = error.response?.data?.detail || error.message;
  return detail?.includes('Whisper') || detail?.includes('SpeechRecognition');
};
