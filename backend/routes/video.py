from flask import Blueprint, request, jsonify, abort
import os
import uuid
import json
import tempfile
import logging
from openai import OpenAI, APIError
from initdb import supabase
import requests
from io import BytesIO

# Initialize client (assuming OPENAI_API_KEY is set)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

bp = Blueprint('video', __name__, url_prefix='/chat')
logger = logging.getLogger(__name__)

# Supabase Storage bucket for videos
VIDEO_BUCKET = "generated-videos"

def ensure_video_bucket():
    """Ensure the video bucket exists in Supabase Storage"""
    try:
        # Try to get bucket info
        bucket_response = supabase.storage.get_bucket(VIDEO_BUCKET)
        if not bucket_response:
            # Create bucket if it doesn't exist (Python API just needs name)
            supabase.storage.create_bucket(VIDEO_BUCKET)
            logger.info(f"Created video bucket: {VIDEO_BUCKET}")
        return True
    except Exception as e:
        logger.error(f"Error ensuring video bucket: {e}")
        return False

def generate_simple_video_with_eleven_labs(script_lines, job_id):
    """
    Generate a simple video using ElevenLabs for TTS and a simple video service
    This is more deployment-friendly than MoviePy
    """
    try:
        # For now, we'll create a simple audio-only "video" or use a lightweight approach
        # You can integrate with services like:
        # - ElevenLabs for TTS
        # - Remotion or similar for video generation
        # - Or use a simple slideshow approach
        
        # For demonstration, let's create a simple text-based video using a cloud service
        # This is a placeholder - you'd integrate with your preferred video generation service
        
        # Option 1: Use a video generation API service
        # Option 2: Create a simple slideshow with images
        # Option 3: Use AI video generation services
        
        # For now, let's simulate generating a video URL
        video_url = f"https://example-video-service.com/generate/{job_id}"
        return video_url
        
    except Exception as e:
        logger.error(f"Error generating video: {e}")
        raise

def create_video_with_cloud_service(text_content, job_id):
    """
    Create a video using cloud-based services instead of local processing
    This approach is more suitable for deployment without Docker
    """
    try:
        # Option 1: Use AI video generation services like:
        # - Synthesia API
        # - D-ID API  
        # - RunwayML API
        # - Luma AI
        
        # Option 2: Use text-to-speech + simple video creation
        # - Generate TTS audio using OpenAI or ElevenLabs
        # - Create simple video with static background and subtitles
        # - Use services like Remotion, FFMPEG APIs, or video generation APIs
        
        # For this implementation, let's use a simplified approach:
        # 1. Generate TTS audio using OpenAI
        # 2. Create a simple video with text overlay using a cloud service
        
        # Generate TTS audio
        logger.info(f"[{job_id}] Generating TTS audio...")
        audio_response = client.audio.speech.create(
            model="tts-1",
            voice="alloy", 
            input=text_content
        )
        
        # Get audio as bytes
        audio_bytes = audio_response.content
        
        # Upload audio to Supabase Storage (temporary)
        audio_filename = f"temp_audio_{job_id}.mp3"
        audio_upload = supabase.storage.from_(VIDEO_BUCKET).upload(
            audio_filename, 
            audio_bytes,
            {"contentType": "audio/mpeg"}
        )
        
        # Check for upload errors (Supabase Python client response handling)
        if hasattr(audio_upload, 'error') and audio_upload.error:
            raise Exception(f"Failed to upload audio: {audio_upload.error}")
        
        # For now, we'll create a simple "video" that's actually just the audio
        # In a real implementation, you'd use a video generation service here
        
        # Create a simple video metadata record
        video_filename = f"video_{job_id}.mp4"
        
        # For demonstration, we'll simulate a video by creating a metadata record
        # In production, you'd call an actual video generation service
        
        # Get public URL for the audio (simulating video)
        audio_url_response = supabase.storage.from_(VIDEO_BUCKET).get_public_url(audio_filename)
        
        # Check for URL errors and extract URL correctly
        if hasattr(audio_url_response, 'error') and audio_url_response.error:
            raise Exception(f"Failed to get public URL: {audio_url_response.error}")
        
        # Extract the URL correctly based on Supabase Python client structure
        if hasattr(audio_url_response, 'data') and hasattr(audio_url_response.data, 'publicUrl'):
            audio_url = audio_url_response.data.publicUrl
        elif hasattr(audio_url_response, 'publicUrl'):
            audio_url = audio_url_response.publicUrl
        else:
            # Fallback - try to access as dict
            audio_url = audio_url_response.get('publicUrl') if hasattr(audio_url_response, 'get') else str(audio_url_response)
        
        # Return the public URL (in real implementation, this would be a video URL)
        return audio_url
        
    except Exception as e:
        logger.error(f"Error creating video with cloud service: {e}")
        raise

@bp.route('/generate-video', methods=['POST'])
def generate_video_route():
    if not client:
        abort(500, description="OpenAI client not initialized. Check API key.")

    data = request.get_json()
    input_text = data.get('text')
    if not input_text:
        abort(400, description="Missing 'text' in request body.")

    # Ensure Supabase video bucket exists
    if not ensure_video_bucket():
        abort(500, description="Failed to initialize video storage.")

    job_id = str(uuid.uuid4())
    logger.info(f"[{job_id}] Starting cloud-based video generation...")

    try:
        # Generate script using OpenAI
        logger.info(f"[{job_id}] Generating script...")
        script_prompt = f"""Based on the following text, create a script suitable for an explanatory video. 
        Make it engaging and educational. Keep it concise but informative.

        TEXT:
        {input_text}"""
        
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful scriptwriter for educational videos."},
                {"role": "user", "content": script_prompt}
            ]
        )
        
        script_text = completion.choices[0].message.content or ""
        logger.info(f"[{job_id}] Script generated successfully.")

        if not script_text.strip():
            abort(500, description="Failed to generate a valid script.")

        # Create video using cloud services
        logger.info(f"[{job_id}] Creating video using cloud services...")
        video_url = create_video_with_cloud_service(script_text, job_id)
        
        logger.info(f"[{job_id}] Video generation complete: {video_url}")

        return jsonify({
            "message": "Video generated successfully", 
            "video_url": video_url,
            "job_id": job_id
        })

    except APIError as e:
        logger.error(f"[{job_id}] OpenAI API error: {e}")
        abort(502, description=f"AI service error: {e}")
    except Exception as e:
        logger.error(f"[{job_id}] General error in video generation: {e}")
        abort(500, description=f"Failed to generate video: {str(e)}")

# New route for getting video status (useful for async processing)
@bp.route('/video-status/<string:job_id>', methods=['GET'])
def get_video_status(job_id):
    """
    Get the status of a video generation job
    This is useful if you implement async video processing
    """
    try:
        # Check if video exists in Supabase Storage
        video_filename = f"video_{job_id}.mp4"
        
        # Try to get the file info
        file_response = supabase.storage.from_(VIDEO_BUCKET).list(
            path="",
            search=video_filename
        )
        
        if file_response and len(file_response) > 0:
            # Video exists, get public URL
            url_response = supabase.storage.from_(VIDEO_BUCKET).get_public_url(video_filename)
            return jsonify({
                "status": "completed",
                "video_url": url_response['data']['publicUrl']
            })
        else:
            return jsonify({
                "status": "processing"
            })
            
    except Exception as e:
        logger.error(f"Error checking video status: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500 